import http from 'http';
import FormData from 'form-data';

const form = new FormData();
form.append('inputType', 'url');
form.append('url', 'http://example.com');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze',
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
    console.log('BODY:', data.substring(0, 100));
  });
});

form.pipe(req);
