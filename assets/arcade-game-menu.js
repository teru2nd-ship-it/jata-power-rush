(function(){
  'use strict';
  if(window.__jataArcadeMenu) return;
  window.__jataArcadeMenu=1;

  var cfg=window.JATA_ARCADE_MENU||{};
  var homeUrl=cfg.homeUrl||'https://www.teru44.net/games';
  var title=cfg.title||document.title;
  var shareText=cfg.shareText||title+'で遊ぼう！';
  var audioEvent=cfg.audioEvent||'jata-audio-change';
  var toggleAudioName=cfg.toggleAudio||'togglePowerRushAudio';
  var audioStateName=cfg.audioState||'powerRushAudioEnabled';

  function shareUrl(){
    var canonical=document.querySelector('link[rel="canonical"]');
    return canonical&&canonical.href?canonical.href:location.href.split('#')[0];
  }
  function openPopup(url){ window.open(url,'_blank','noopener,noreferrer'); }
  function init(){
    var style=document.createElement('style');
    style.textContent=
      '#jm-hot{position:fixed;top:0;left:0;right:0;height:22px;z-index:2147483640}'+
      '#jm-handle{position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483646;width:58px;height:18px;display:grid;place-items:center;background:rgba(19,26,39,.94);border:1px solid #5b6577;border-top:0;border-radius:0 0 8px 8px;color:#d9dfeb;font:900 12px/1 -apple-system,sans-serif;cursor:pointer;touch-action:manipulation;transition:opacity .2s}'+
      '#jm-handle.jm-hidden{opacity:0;pointer-events:none}'+
      '#jm-bar{position:fixed;top:0;left:50%;transform:translate(-50%,-120%);z-index:2147483647;display:flex;gap:8px;padding:8px 10px;background:rgba(13,18,28,.97);border:1px solid #5b6577;border-top:0;border-radius:0 0 8px 8px;box-shadow:0 8px 24px rgba(0,0,0,.5);transition:transform .25s ease}'+
      '#jm-bar.jm-show{transform:translate(-50%,0)}'+
      '.jm-button{min-height:38px;padding:8px 13px;border:1px solid #667186;border-radius:6px;background:#192131;color:#f5f7fb;font:900 13px/1 "Zen Kaku Gothic New",-apple-system,sans-serif;text-decoration:none;white-space:nowrap;cursor:pointer;touch-action:manipulation}'+
      '.jm-button:active,.jm-quick-button:active{transform:scale(.94);border-color:#f0c966}'+
      '#jm-quick{position:fixed;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));z-index:2147483645;display:flex;gap:8px}'+
      '.jm-quick-button{width:42px;height:42px;display:grid;place-items:center;padding:0;border:1px solid #667186;border-radius:7px;background:rgba(13,18,28,.94);box-shadow:0 3px 12px rgba(0,0,0,.45);color:#fff;font:20px/1 -apple-system,sans-serif;cursor:pointer;touch-action:manipulation}'+
      '.jm-quick-button[aria-pressed="true"]{border-color:#f0c966;box-shadow:0 0 0 1px rgba(240,201,102,.25),0 3px 12px rgba(0,0,0,.45)}'+
      '#jm-share-sheet{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(3,5,9,.82);backdrop-filter:blur(8px)}'+
      '#jm-share-sheet.jm-show{display:flex}'+
      '#jm-share-card{width:min(360px,calc(100vw - 32px));padding:20px;border:2px solid #f0c966;border-radius:8px;background:#141b28;box-shadow:0 18px 50px rgba(0,0,0,.7);color:#fff;text-align:center;font-family:"Zen Kaku Gothic New",sans-serif}'+
      '#jm-share-title{font-size:22px;font-weight:900;color:#f0c966}'+
      '#jm-share-copy{margin:4px 0 16px;color:#d1d7e2;font-size:13px;font-weight:700}'+
      '#jm-share-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'+
      '#jm-share-actions .jm-button{padding-inline:6px}'+
      '#jm-share-close{width:100%;margin-top:10px}'+
      '#jm-share-status{min-height:20px;margin-top:7px;color:#7dffb1;font-size:12px;font-weight:900}';
    document.head.appendChild(style);

    var hot=document.createElement('div'); hot.id='jm-hot';
    var handle=document.createElement('button'); handle.id='jm-handle'; handle.textContent='▾'; handle.setAttribute('aria-label','メニュー');
    var bar=document.createElement('div'); bar.id='jm-bar';
    var home=document.createElement('a'); home.className='jm-button'; home.href=homeUrl; home.target='_top'; home.textContent='🏠 GAMES';
    var fullscreen=document.createElement('button'); fullscreen.className='jm-button';
    bar.appendChild(home); bar.appendChild(fullscreen);

    var quick=document.createElement('div'); quick.id='jm-quick';
    var sound=document.createElement('button'); sound.className='jm-quick-button'; sound.setAttribute('aria-label','BGM・効果音切替'); sound.title='BGM・効果音';
    var share=document.createElement('button'); share.className='jm-quick-button'; share.textContent='↗'; share.setAttribute('aria-label','ゲームを共有'); share.title='共有';
    quick.appendChild(sound); quick.appendChild(share);

    function updateSound(enabled){
      sound.textContent=enabled?'🔊':'🔇';
      sound.setAttribute('aria-pressed',enabled?'true':'false');
    }
    var audioState=window[audioStateName];
    updateSound(typeof audioState==='function'?!!audioState():true);
    sound.addEventListener('click',function(e){
      e.stopPropagation();
      var toggle=window[toggleAudioName];
      if(typeof toggle==='function') toggle();
    });
    window.addEventListener(audioEvent,function(e){ updateSound(!!e.detail.enabled); });

    var sheet=document.createElement('div'); sheet.id='jm-share-sheet'; sheet.setAttribute('role','dialog'); sheet.setAttribute('aria-modal','true'); sheet.setAttribute('aria-label',title+'を共有');
    var card=document.createElement('div'); card.id='jm-share-card';
    var sheetTitle=document.createElement('div'); sheetTitle.id='jm-share-title'; sheetTitle.textContent='修行仲間に共有';
    var sheetCopy=document.createElement('div'); sheetCopy.id='jm-share-copy'; sheetCopy.textContent=title+'をシェア';
    var actions=document.createElement('div'); actions.id='jm-share-actions';
    var x=document.createElement('button'); x.className='jm-button'; x.textContent='X';
    var line=document.createElement('button'); line.className='jm-button'; line.textContent='LINE';
    var copy=document.createElement('button'); copy.className='jm-button'; copy.textContent='URLコピー';
    var status=document.createElement('div'); status.id='jm-share-status';
    var close=document.createElement('button'); close.id='jm-share-close'; close.className='jm-button'; close.textContent='閉じる';
    actions.appendChild(x); actions.appendChild(line); actions.appendChild(copy);
    card.appendChild(sheetTitle); card.appendChild(sheetCopy); card.appendChild(actions); card.appendChild(status); card.appendChild(close); sheet.appendChild(card);

    function showSheet(){ status.textContent=''; sheet.classList.add('jm-show'); }
    function closeSheet(){ sheet.classList.remove('jm-show'); }
    function copyUrl(){
      var url=shareUrl();
      function done(){ status.textContent='URLをコピーしました'; }
      if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(url).then(done,function(){status.textContent=url;}); return; }
      var area=document.createElement('textarea'); area.value=url; area.style.position='fixed'; area.style.opacity='0'; document.body.appendChild(area); area.select();
      try{ document.execCommand('copy'); done(); }catch(e){ status.textContent=url; }
      document.body.removeChild(area);
    }
    function shareGame(){
      var data={title:title,text:shareText,url:shareUrl()};
      if(navigator.share) navigator.share(data).catch(function(err){ if(!err||err.name!=='AbortError') showSheet(); });
      else showSheet();
    }
    share.addEventListener('click',function(e){ e.stopPropagation(); shareGame(); });
    x.addEventListener('click',function(){ openPopup('https://twitter.com/intent/tweet?text='+encodeURIComponent(shareText)+'&url='+encodeURIComponent(shareUrl())); });
    line.addEventListener('click',function(){ openPopup('https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(shareUrl())); });
    copy.addEventListener('click',copyUrl); close.addEventListener('click',closeSheet);
    sheet.addEventListener('click',function(e){ if(e.target===sheet) closeSheet(); });

    var timer=null;
    function showMenu(){ clearTimeout(timer); bar.classList.add('jm-show'); handle.classList.add('jm-hidden'); }
    function hideMenu(){ timer=setTimeout(function(){ bar.classList.remove('jm-show'); handle.classList.remove('jm-hidden'); },220); }
    hot.addEventListener('mouseenter',showMenu);
    bar.addEventListener('mouseenter',function(){ clearTimeout(timer); });
    bar.addEventListener('mouseleave',hideMenu);
    handle.addEventListener('click',function(e){ e.stopPropagation(); if(bar.classList.contains('jm-show')) hideMenu(); else showMenu(); });
    document.addEventListener('click',function(e){ if(bar.classList.contains('jm-show')&&!bar.contains(e.target)&&e.target!==handle) hideMenu(); });

    var root=document.documentElement;
    var requestFullscreen=root.requestFullscreen||root.webkitRequestFullscreen;
    var exitFullscreen=document.exitFullscreen||document.webkitExitFullscreen;
    if(requestFullscreen){
      fullscreen.textContent='⛶ 全画面';
      fullscreen.addEventListener('click',function(){
        var active=document.fullscreenElement||document.webkitFullscreenElement;
        if(active){ if(exitFullscreen) exitFullscreen.call(document); }
        else requestFullscreen.call(root);
      });
      document.addEventListener('fullscreenchange',function(){ fullscreen.textContent=document.fullscreenElement?'⛶ 解除':'⛶ 全画面'; });
    }else{
      fullscreen.textContent='🗗 別ウィンドウ';
      fullscreen.addEventListener('click',function(){ window.open(location.href,'_blank','noopener'); });
    }

    document.body.appendChild(hot); document.body.appendChild(handle); document.body.appendChild(bar); document.body.appendChild(quick); document.body.appendChild(sheet);
  }
  if(document.body) init(); else document.addEventListener('DOMContentLoaded',init);
})();
