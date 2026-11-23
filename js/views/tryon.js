"use strict";
/* AGORA · 2D try-on (and the hidden AI model lab) */
/* ---------- 2D TRY-ON: actual uploaded wardrobe photos only ---------- */
const tryonSelected={top:null,bottom:null,dress:null,outer:null,shoes:null,acc:[]};
const tryonRoles=[['top','Tops'],['outer','Outerwear'],['bottom','Bottoms'],['dress','Dresses'],['shoes','Shoes'],['acc','Accessories']];
function tryonRole(it){
    const c=T(it).cat;
    if(['top','bottom','dress','outer','shoes'].includes(c))return c;
    if(c==='acc')return 'acc';
    return null;
}
function renderTryOn(){
    const items=wardrobeItems(),picker=$("#tryon-items"),preview=$("#tryon-preview");
    const modelPreview=$("#ai-model-preview"),modelFile=$("#ai-model-file"),modelUpload=$("#ai-model-upload"),modelRemove=$("#ai-model-remove");
    if(modelPreview){
        modelPreview.innerHTML=S.user?.modelImage?`<img src="${S.user.modelImage}" alt="Your uploaded AI-generated model reference">`:'No AI model image uploaded yet';
        if(modelRemove)modelRemove.hidden=!S.user?.modelImage;
    }
    if(modelUpload&&modelFile&&!modelUpload.dataset.bound){
        modelUpload.dataset.bound='1';
        modelUpload.onclick=()=>modelFile.click();
        modelFile.onchange=async()=>{
            const file=modelFile.files&&modelFile.files[0];if(!file)return;
            if(!/^image\/(png|jpeg|webp)$/.test(file.type)){toast('Please choose a PNG, JPG, or WebP image.');modelFile.value='';return;}
            if(file.size>8*1024*1024){toast('Please choose an image smaller than 8 MB.');modelFile.value='';return;}
            const reader=new FileReader();
            reader.onload=async()=>{
                S.user.modelImage=String(reader.result);
                await save();
                renderTryOn();
                toast('AI model image saved.');
            };
            reader.onerror=()=>toast('Could not read that image. Please try another file.');
            reader.readAsDataURL(file);
        };
    }
    if(modelRemove&&!modelRemove.dataset.bound){
        modelRemove.dataset.bound='1';
        modelRemove.onclick=async()=>{
            if(S.user){S.user.modelImage=null;S.user._cloudModelImagePath=null;await save();renderTryOn();toast('AI model image removed.');}
        };
    }
    const geminiPromptButton=$("#ai-model-generate-prompt"),copyPromptButton=$("#ai-model-copy-prompt"),promptBox=$("#ai-model-prompt"),consentBox=$("#ai-model-consent"),modelStatus=$("#ai-model-status");
    const geminiBaseModelButton=$("#ai-model-generate-image");
    if(geminiBaseModelButton&&!geminiBaseModelButton.dataset.bound){
        geminiBaseModelButton.dataset.bound='1';
        geminiBaseModelButton.onclick=async()=>{
            if(!S.user?._cloudUid){toast('Please sign in to AGORA first.');return;}
            if(!consentBox?.checked){toast('Please agree before sending your model preference to Google Gemini.');return;}
            geminiBaseModelButton.disabled=true;
            if(modelStatus)modelStatus.textContent='Gemini is creating your base model image…';
            try{
                const {data,error}=await sb.functions.invoke('gemini-virtual-tryon',{body:{mode:'generate-model',gender:S.user.gender||'female'}});
                if(error)throw error;
                if(!data?.resultPath||!data?.resultUrl)throw new Error(data?.error||'Gemini did not return a base model image.');
                S.user.modelImage=data.resultUrl;
                S.user._cloudModelImagePath=data.resultPath;
                await save();
                renderTryOn();
                if(modelStatus)modelStatus.textContent='Your base model is saved. AGORA will reuse it for every outfit edit.';
                toast('Base model generated and saved.');
            }catch(err){
                console.error('Gemini base model generation failed:',err);
                const message=err?.message||String(err);
                if(modelStatus)modelStatus.textContent='Base model generation failed: '+message+'. Check your Gemini key, billing, and Edge Function deployment.';
                toast('Could not generate the base model. Check the status message.');
            }finally{geminiBaseModelButton.disabled=false;}
        };
    }
    if(geminiPromptButton&&!geminiPromptButton.dataset.bound){
        geminiPromptButton.dataset.bound='1';
        geminiPromptButton.onclick=async()=>{
            if(!consentBox?.checked){toast('Please confirm before sending your profile details to Google Gemini.');return;}
            if(!S.user){toast('Please log in first.');return;}
            geminiPromptButton.disabled=true;
            if(modelStatus)modelStatus.textContent='Generating your personalized prompt with Gemini…';
            try{
                const {data,error}=await sb.functions.invoke('generate-model-prompt',{body:{gender:S.user.gender||'female'}});
                if(error)throw error;
                if(!data?.prompt)throw new Error(data?.error||'Gemini did not return a prompt.');
                promptBox.textContent=data.prompt;
                if(modelStatus)modelStatus.textContent='Prompt generated. Copy it and use it in an image generator. Gemini has not generated an image.';
                toast('Gemini image prompt generated.');
            }catch(err){
                console.error('Gemini prompt generation failed:',err);
                const message=err?.message||String(err);
                if(modelStatus)modelStatus.textContent='Gemini is not connected yet or the request failed: '+message+'. Check the setup instructions included with this project.';
                toast('Gemini prompt generation failed. Check setup instructions.');
            }finally{geminiPromptButton.disabled=false;}
        };
    }
    if(copyPromptButton&&!copyPromptButton.dataset.bound){
        copyPromptButton.dataset.bound='1';
        copyPromptButton.onclick=async()=>{
            const textToCopy=promptBox?.textContent?.trim()||'';
            if(!textToCopy){toast('There is no prompt to copy.');return;}
            try{
                if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(textToCopy);
                else{const area=document.createElement('textarea');area.value=textToCopy;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Clipboard is unavailable');}
                toast('Prompt copied.');
            }catch(err){toast('Could not copy automatically. Please select and copy the prompt.');}
        };
    }
    const aiTryOnButton=$("#ai-tryon-generate"),aiTryOnStatus=$("#ai-tryon-status"),aiTryOnResult=$("#ai-tryon-result");
    if(aiTryOnResult){
        const latest=(S.user?.tryOnResults||[]).slice().sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
        aiTryOnResult.innerHTML=latest?.url
            ?`<img src="${esc(latest.url)}" alt="AI-generated outfit preview"><p>${esc((latest.garments||[]).join(', '))}</p><a href="${esc(latest.url)}" target="_blank" rel="noopener">Open generated image</a>`
            :'Your generated outfit image will appear here.';
    }
    if(aiTryOnButton&&!aiTryOnButton.dataset.bound){
        aiTryOnButton.dataset.bound='1';
        aiTryOnButton.onclick=async()=>{
            if(!S.user){toast('Please log in first.');return;}
            if(!S.user._cloudUid){toast('Please sign in with your AGORA account before generating an AI outfit.');return;}
            if(!S.user.modelImage){toast('Upload your base model image first.');return;}
            if(!consentBox?.checked){toast('Please agree before sending your photos to Google Gemini.');return;}
            const selected=[];
            const dressItem=items.find(x=>x.id===tryonSelected.dress);
            if(dressItem)selected.push(dressItem);
            else{
                for(const role of ['top','bottom']){
                    const item=items.find(x=>x.id===tryonSelected[role]);
                    if(item)selected.push(item);
                }
            }
            for(const role of ['outer','shoes']){
                const item=items.find(x=>x.id===tryonSelected[role]);
                if(item)selected.push(item);
            }
            for(const id of tryonSelected.acc){const item=items.find(x=>x.id===id);if(item)selected.push(item);}
            if(!selected.length){toast('Select at least one clothing item first.');return;}
            if(selected.length>6){toast('Please select no more than 6 clothing items for one generation.');return;}
            aiTryOnButton.disabled=true;
            if(aiTryOnStatus)aiTryOnStatus.textContent='Preparing your saved model and clothing photos…';
            try{
                // Ensure local data URLs are uploaded first so the Edge Function can read private Storage objects.
                await save();
                const modelImagePath=S.user._cloudModelImagePath;
                const garments=selected.map(item=>({
                    name:item.name||'Clothing item',
                    category:T(item).label||T(item).cat||'Clothing',
                    imagePath:item._cloudImagePath
                }));
                if(!modelImagePath||garments.some(g=>!g.imagePath))throw new Error('Some photos have not synced to your AGORA cloud storage yet. Please try Save again.');
                if(aiTryOnStatus)aiTryOnStatus.textContent='Gemini is editing your outfit. This may take a little while…';
                const {data,error}=await sb.functions.invoke('gemini-virtual-tryon',{body:{modelImagePath,garments}});
                if(error)throw error;
                if(!data?.resultPath||!data?.resultUrl)throw new Error(data?.error||'Gemini did not return a generated image.');
                S.user.tryOnResults=S.user.tryOnResults||[];
                S.user.tryOnResults.unshift({id:uid(),path:data.resultPath,url:data.resultUrl,createdAt:Date.now(),garments:selected.map(x=>x.name||'Clothing item')});
                S.user.tryOnResults=S.user.tryOnResults.slice(0,10);
                await save();
                if(aiTryOnStatus)aiTryOnStatus.textContent='Your AI outfit image is ready. The original base model remains saved for your next outfit.';
                renderTryOn();
                toast('AI outfit image generated and saved.');
            }catch(err){
                console.error('Gemini virtual try-on failed:',err);
                const message=err?.message||String(err);
                if(aiTryOnStatus)aiTryOnStatus.textContent='AI try-on failed: '+message+'. Check your Gemini key, billing, Edge Function deployment, and Storage permissions.';
                toast('AI try-on failed. Check the status message.');
            }finally{aiTryOnButton.disabled=false;}
        };
    }
    if(!items.length){
        picker.innerHTML=`<div class="empty"><h3>No clothing photos yet</h3><p>Upload your own clothing photos in Closet first. Your uploaded photos will appear here.</p><button class="btn terra" id="tryon-add">+ Upload clothing</button></div>`;
        const add=$("#tryon-add");if(add)add.onclick=()=>openAddSheet();
        preview.innerHTML=mannequinSVG({},0,{gender:S.user?.gender,label:"Empty 2D mannequin"})+`<p class="tryon-board-empty">Upload clothes to dress the mannequin.</p>`;
        return;
    }
    const available=new Set(items.map(x=>x.id));
    for(const role of ['top','bottom','dress','outer','shoes'])if(tryonSelected[role]&&!available.has(tryonSelected[role]))tryonSelected[role]=null;
    tryonSelected.acc=tryonSelected.acc.filter(id=>available.has(id));
    picker.innerHTML=`<div class="tryon-groups">${tryonRoles.map(([role,label])=>{
        const group=items.filter(it=>tryonRole(it)===role);
        if(!group.length)return '';
        return `<div class="tryon-group"><h3>${label}</h3><div class="tryon-choice-list">${group.map(it=>{
            const selected=role==='acc'?tryonSelected.acc.includes(it.id):tryonSelected[role]===it.id;
            return `<button type="button" class="tryon-choice" data-tryon="${esc(it.id)}" aria-pressed="${selected}"><img src="${it.img}" alt=""><span>${esc(it.name)}<br><small>${esc(colorName(it.color))}</small></span><small>${selected?'Selected':'Select'}</small></button>`;
        }).join('')}</div></div>`;
    }).join('')}</div>`;

    const outfit={top:null,bottom:null,dress:null,outer:null,shoes:null,acc:[]};
    for(const role of ['top','bottom','dress','outer','shoes'])outfit[role]=items.find(x=>x.id===tryonSelected[role])||null;
    outfit.acc=items.filter(x=>tryonSelected.acc.includes(x.id));
    const chosen=[...['top','outer','bottom','dress','shoes'].map(role=>outfit[role]).filter(Boolean),...outfit.acc];
    const garmentNames=chosen.map(x=>x.name).join(', ');
    preview.innerHTML=mannequinSVG(outfit,0,{gender:S.user?.gender,label:garmentNames?`Mannequin wearing ${garmentNames}`:'Undressed mannequin'})+
        `<p class="tryon-board-empty" ${chosen.length?'hidden':''}>Select clothes from your closet to dress the mannequin.</p>`;
    // The mannequin renderer uses AGORA's photo-fitting engine (renderWorn), not fixed image boxes.
    dressPending();

    for(const b of $$('[data-tryon]',picker))b.onclick=()=>{
        const it=items.find(x=>x.id===b.dataset.tryon),role=tryonRole(it);if(!role)return;
        if(role==='acc'){
            const i=tryonSelected.acc.indexOf(it.id);
            if(i>=0)tryonSelected.acc.splice(i,1);else tryonSelected.acc.push(it.id);
        }else tryonSelected[role]=tryonSelected[role]===it.id?null:it.id;
        renderTryOn();
    };
    const clear=$("#tryon-clear");if(clear)clear.onclick=()=>{for(const role of ['top','bottom','dress','outer','shoes'])tryonSelected[role]=null;tryonSelected.acc=[];renderTryOn()};
}
