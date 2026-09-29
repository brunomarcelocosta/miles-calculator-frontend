// Render the sharing image from the existing vector brand, without remote assets.
const {chromium}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  const logo=fs.readFileSync('public/logo-travion.svg','utf8');
  await page.setContent(`<html><body style="margin:0;background:#f6f2e9;color:#25231f;font-family:Georgia,serif"><main style="box-sizing:border-box;width:1200px;height:630px;padding:70px 80px;position:relative"><div style="width:200px;height:66px">${logo}</div><p style="font:20px Arial;color:#79664e;letter-spacing:3px;margin-top:50px">CALCULADORA DE MILHAS</p><h1 style="font-weight:400;font-size:64px;line-height:1.08;max-width:900px;margin:24px 0">Descubra quantas milhas você pode acumular</h1><p style="font:24px Arial;color:#645d52">Transforme seus gastos do dia a dia em viagens.</p><div style="position:absolute;bottom:38px;right:80px;font:18px Arial;color:#79664e">calculadora.travion.com.br</div></main></body></html>`);
  await page.screenshot({path:'public/og-image.png'});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
