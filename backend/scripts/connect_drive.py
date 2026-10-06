#!/usr/bin/env python3
"""Authorize one academy Drive account and create a private folder using drive.file scope.
Run manually; no credentials are sent until you approve Google's consent screen.
"""
import argparse
import base64
import hashlib
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import secrets
import time
import urllib.parse
import urllib.request
import webbrowser

REDIRECT_URI = 'http://localhost:8765/oauth/callback'
SCOPE = 'https://www.googleapis.com/auth/drive.file'


def request_json(url, data, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {}, method='POST')
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', default='backend/.env.drive', help='New private env file; refuses to overwrite an existing file')
    args = parser.parse_args()
    client_id = os.environ.get('GOOGLE_DRIVE_CLIENT_ID', '')
    client_secret = os.environ.get('GOOGLE_DRIVE_CLIENT_SECRET', '')
    if not client_id or not client_secret:
        parser.error('Set GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET first.')
    destination = Path(args.output)
    if destination.exists():
        parser.error('The output file already exists. Choose another path or move your previous file first.')
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    result = {}

    class Callback(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Authorization codes must never appear in HTTP logs.

        def do_GET(self):
            url = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(url.query)
            valid = url.path == '/oauth/callback' and secrets.compare_digest(params.get('state', [''])[0], state)
            if valid:
                result.update({key: values[0] for key, values in params.items()})
            self.send_response(200 if valid else 400)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'You can close this tab and return to the terminal.' if valid else b'Invalid OAuth callback.')

    authorize = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode({
        'client_id': client_id, 'redirect_uri': REDIRECT_URI, 'response_type': 'code',
        'scope': SCOPE, 'access_type': 'offline', 'prompt': 'consent', 'state': state,
        'code_challenge': challenge, 'code_challenge_method': 'S256',
    })
    with HTTPServer(('127.0.0.1', 8765), Callback) as server:
        server.timeout = 1
        print('Open this URL and authorize the academy storage account:\n' + authorize)
        webbrowser.open(authorize)
        deadline = time.monotonic() + 300
        while not result and time.monotonic() < deadline:
            server.handle_request()
    if 'code' not in result:
        raise RuntimeError('Authorization was denied or timed out. No credentials were saved.')
    tokens = request_json('https://oauth2.googleapis.com/token', urllib.parse.urlencode({
        'client_id': client_id, 'client_secret': client_secret, 'code': result['code'],
        'redirect_uri': REDIRECT_URI, 'grant_type': 'authorization_code', 'code_verifier': verifier,
    }).encode(), {'Content-Type': 'application/x-www-form-urlencoded'})
    if 'refresh_token' not in tokens:
        raise RuntimeError('Google did not return a refresh token. Revoke previous consent and authorize again.')
    folder = request_json('https://www.googleapis.com/drive/v3/files?fields=id', json.dumps({
        'name': 'Noor Academy Materials', 'mimeType': 'application/vnd.google-apps.folder',
    }).encode(), {'Authorization': 'Bearer ' + tokens['access_token'], 'Content-Type': 'application/json'})
    values = {'GOOGLE_DRIVE_CLIENT_ID': client_id, 'GOOGLE_DRIVE_CLIENT_SECRET': client_secret,
              'GOOGLE_DRIVE_REFRESH_TOKEN': tokens['refresh_token'], 'GOOGLE_DRIVE_FOLDER_ID': folder['id']}
    # Quote values for bash; the file can be sourced without exposing credentials on command lines.
    import shlex
    data = ''.join('export ' + key + '=' + shlex.quote(value) + '\n' for key, value in values.items())
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as handle:
        handle.write(data)
    print(f'Connected storage. Credentials saved privately to {destination}; do not commit this file.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid dumping OAuth/Drive responses or credentials in tracebacks.
        raise SystemExit(f'Storage setup failed: {type(error).__name__}. Check the OAuth configuration and try again.')
