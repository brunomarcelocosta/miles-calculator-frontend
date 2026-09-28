// Run with the frontend dev server at DIAGNOSTIC_URL (defaults to port 5180).
// Validates browser payloads against the compiled API schemas in the adjacent repo.
const {chromium,expect}=require('@playwright/test');
const {answerSchemas,cleanAnswers,diagnosticResult}=require('../../miles-calculator-api/dist/domain/diagnostic/diagnostic');
const {createLeadSchema}=require('../../miles-calculator-api/dist/leads/dto/create-lead.dto');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const experienced of [false,true]){
   const context=await browser.newContext({viewport:experienced?{width:390,height:844}:{width:1100,height:950}});
   const page=await context.newPage();let answers={};const errors=[];let saves=0;
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(!path.startsWith('/api/'))return route.continue();
    const data=request.postDataJSON();let response;
    if(path==='/api/leads'){createLeadSchema.parse(data);response={id:'00000000-0000-4000-8000-000000000002'}}
    else if(path.endsWith('/step')){answerSchemas[data.step].parse(data.answer);answers=cleanAnswers({...answers,[data.step]:data.answer});saves++;response={ok:true}}
    else if(path.endsWith('/complete'))response=diagnosticResult(answers);
    else throw Error('Unexpected API request: '+path);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(response)});
   });
   await page.goto(process.env.DIAGNOSTIC_URL||'http://127.0.0.1:5180');
   await page.getByRole('button',{name:'Descobrir meu potencial'}).click();
   await page.getByLabel('Como podemos te chamar?').fill('Ana');
   if(experienced){await page.getByRole('textbox',{name:'WhatsApp',exact:true}).fill('12997643952')}
   else {await page.getByRole('radio',{name:'E-mail'}).check();await page.locator('input[type=email]').fill('ana@example.com')}
   await page.getByRole('button',{name:'Continuar',exact:true}).click();
   for(const label of ['2–3 vezes por ano','Direto com a companhia aérea','Mais de R$ 20 mil até R$ 30 mil'])await page.getByRole('button',{name:label,exact:true}).click();
   await page.getByRole('radio',{name:'Sim, quase tudo em um cartão'}).check();await page.getByLabel('Banco do cartão principal (opcional)').selectOption('Itaú');await page.getByRole('button',{name:'Continuar',exact:true}).click();
   await page.getByRole('button',{name:experienced?'Já utilizo com frequência':'Não sei como funciona',exact:true}).click();
   await page.getByRole('button',{name:'Sim',exact:true}).click();
   if(experienced){await page.getByRole('checkbox',{name:'Livelo',exact:true}).check();await page.getByLabel('Saldo total aproximado (opcional)').selectOption('unknown');await page.getByRole('button',{name:'Continuar',exact:true}).click()}
   await page.getByRole('button',{name:experienced?'Sim':'Ainda não',exact:true}).click();
   if(experienced){await page.getByLabel('Destino',{exact:true}).selectOption('Europa');await page.getByLabel('Quantas pessoas?').selectOption('two');await page.getByLabel('Classe desejada').selectOption('business');await page.getByRole('button',{name:'Continuar',exact:true}).click()}
   await expect(page.getByRole('heading',{name:'Um próximo passo para suas viagens'})).toBeVisible();
   assert.equal(saves,experienced?9:7);assert.equal(errors.length,0,errors.join('\n'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await expect(page.getByText(/Nossa equipe entrará em contato pelo/)).toBeVisible();
   await page.screenshot({path:'/tmp/travion-diagnostic-'+(experienced?'mobile':'desktop')+'.png',fullPage:true,animations:'disabled'});
   if(experienced){
    // Return from result, change the branch, and ensure the old trip is removed.
    await page.getByRole('button',{name:'Anterior',exact:true}).click();await page.getByRole('button',{name:'Anterior',exact:true}).click();await page.getByRole('button',{name:'Ainda não',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Um próximo passo para suas viagens'})).toBeVisible();assert.equal(answers.tripDetails,undefined);
   }
   await page.reload();await expect(page.getByRole('heading',{name:'Um próximo passo para suas viagens'})).toBeVisible();
   console.log('Passed:',experienced?'knowledgeable/mobile/branch cleanup/resume':'beginner/email/desktop');await context.close();
  }
 } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
