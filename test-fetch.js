const form = new FormData();
form.append('inputType', 'url');
form.append('url', 'http://example.com');

fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  body: form
}).then(res => {
  console.log('STATUS:', res.status);
  return res.text();
}).then(text => {
  console.log('BODY:', text.substring(0, 100));
}).catch(console.error);
