const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dns.resolveSrv('_mongodb._tcp.lms.t4lrtrw.mongodb.net', (err, addresses) => {
  if (err) return console.error("SRV failed:", err);
  dns.resolveTxt('lms.t4lrtrw.mongodb.net', (err2, txt) => {
    if (err2) return console.error("TXT failed:", err2);
    
    const hosts = addresses.map(a => `${a.name}:${a.port}`).join(',');
    const txtOptions = txt.flat().join('&');
    const uri = `mongodb://Madhuri:Madhuri042@${hosts}/lms?${txtOptions}&appName=lms&ssl=true`;
    require('fs').writeFileSync('resolved-uri.txt', uri);
    console.log("URI written to resolved-uri.txt");
  });
});
