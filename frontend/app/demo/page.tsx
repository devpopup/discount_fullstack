'use client'

import { useEffect, useRef, useCallback } from 'react'

const TOTAL = 11

const DEMO_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

  .dp-root {
    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
    background: #0F1A2E;
    color: #fff;
    overflow: hidden;
    height: 100vh;
    width: 100vw;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
  }

  .dp-root {
    --orange: #FF6F31;
    --orange-dark: #E85A1E;
    --navy: #0F1A2E;
    --navy-light: #162035;
    --navy-card: #1A2540;
    --navy-border: #253352;
    --white: #fff;
    --gray-300: #D1D5DB;
    --gray-400: #9CA3AF;
    --gray-500: #6B7280;
    --gray-600: #4B5563;
    --green: #10B981;
    --green-light: #D1FAE5;
    --red: #EF4444;
    --blue: #3B82F6;
    --yellow: #F59E0B;
    --purple: #8B5CF6;
  }

  .dp-root *, .dp-root *::before, .dp-root *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── Step container ── */
  .dp-root .demo { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
  .dp-root .step { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity .5s ease, transform .5s ease; transform: translateX(50px); padding: 20px; }
  .dp-root .step.active { opacity: 1; pointer-events: auto; transform: translateX(0); z-index: 10; }

  /* ── Progress ── */
  .dp-root .progress-bar { position: fixed; top: 0; left: 0; height: 4px; background: var(--orange); transition: width .5s; z-index: 1000; }
  .dp-root .step-counter { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 1000; }
  .dp-root .step-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.2); transition: all .3s; cursor: pointer; }
  .dp-root .step-dot.active { background: var(--orange); width: 24px; border-radius: 4px; }
  .dp-root .step-dot.completed { background: rgba(255,255,255,.5); }

  /* ── Nav buttons ── */
  .dp-root .nav-btn { position: fixed; bottom: 24px; z-index: 1000; background: var(--orange); color: #fff; border: none; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .3s; display: flex; align-items: center; gap: 6px; }
  .dp-root .nav-btn:hover { background: var(--orange-dark); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,111,49,.4); }
  .dp-root .nav-btn.next { right: 36px; }
  .dp-root .nav-btn.prev { left: 36px; background: rgba(255,255,255,.12); }
  .dp-root .nav-btn.prev:hover { background: rgba(255,255,255,.2); }

  /* ── Cursor & click indicator ── */
  .dp-root .cursor-dot { position: absolute; width: 20px; height: 20px; pointer-events: none; z-index: 100; transition: left .8s cubic-bezier(.4,0,.2,1), top .8s cubic-bezier(.4,0,.2,1); opacity: 0; }
  .dp-root .cursor-dot.visible { opacity: 1; }
  .dp-root .cursor-dot svg { width: 20px; height: 20px; filter: drop-shadow(1px 2px 2px rgba(0,0,0,.5)); }
  .dp-root .click-ring { position: absolute; width: 40px; height: 40px; border: 3px solid var(--orange); border-radius: 50%; pointer-events: none; z-index: 99; opacity: 0; transform: translate(-50%,-50%) scale(0); animation: none; }
  .dp-root .click-ring.fire { animation: clickPulse .7s ease-out forwards; }
  @keyframes clickPulse { 0% { opacity: 1; transform: translate(-50%,-50%) scale(0); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(2.5); } }

  /* ── Action label ── */
  .dp-root .action-label { position: absolute; z-index: 101; background: var(--orange); color: #fff; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .4s; box-shadow: 0 4px 12px rgba(0,0,0,.3); max-width: 240px; overflow: visible; }
  .dp-root .action-label::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid var(--orange); }
  .dp-root .action-label.visible { opacity: 1; }

  /* ── Intro ── */
  .dp-root .intro-content { text-align: center; color: #fff; }
  .dp-root .intro-logo { width: 260px; margin: 0 auto 8px; display: block; }
  .dp-root .intro-tagline { font-size: 16px; color: rgba(255,255,255,.5); margin-bottom: 48px; }
  .dp-root .intro-title { font-size: 46px; font-weight: 700; margin-bottom: 14px; line-height: 1.15; }
  .dp-root .intro-title span { color: var(--orange); }
  .dp-root .intro-subtitle { font-size: 18px; color: rgba(255,255,255,.55); max-width: 520px; margin: 0 auto 36px; line-height: 1.5; }
  .dp-root .intro-start { display: inline-flex; align-items: center; gap: 10px; background: var(--orange); color: #fff; border: none; padding: 15px 38px; border-radius: 60px; font-size: 17px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all .3s; }
  .dp-root .intro-start:hover { background: var(--orange-dark); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(255,111,49,.4); }

  /* ── Context Layout ── */
  .dp-root .ctx { display: flex; align-items: center; gap: 50px; max-width: 1200px; width: 100%; }
  .dp-root .ctx-text { flex: 1; color: #fff; }
  .dp-root .ctx-label { display: inline-block; background: rgba(255,111,49,.15); color: var(--orange); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 50px; margin-bottom: 14px; }
  .dp-root .ctx-h { font-size: 32px; font-weight: 700; line-height: 1.2; margin-bottom: 14px; }
  .dp-root .ctx-h span { color: var(--orange); }
  .dp-root .ctx-p { font-size: 15px; color: rgba(255,255,255,.55); line-height: 1.6; max-width: 380px; }
  .dp-root .ctx-mockup { flex-shrink: 0; }

  /* ── Browser mockup ── */
  .dp-root .browser { width: 720px; height: 460px; background: var(--navy); border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,.6); overflow: hidden; position: relative; border: 1px solid var(--navy-border); }
  .dp-root .browser-bar { height: 36px; background: #0C1220; display: flex; align-items: center; padding: 0 12px; gap: 10px; border-bottom: 1px solid var(--navy-border); }
  .dp-root .browser-dots { display: flex; gap: 6px; }
  .dp-root .browser-dots span { width: 10px; height: 10px; border-radius: 50%; }
  .dp-root .browser-dots span:nth-child(1) { background: #FF5F57; }
  .dp-root .browser-dots span:nth-child(2) { background: #FFBD2E; }
  .dp-root .browser-dots span:nth-child(3) { background: #27C93F; }
  .dp-root .browser-url { flex: 1; background: rgba(255,255,255,.06); border: 1px solid var(--navy-border); border-radius: 5px; padding: 3px 10px; font-size: 11px; color: var(--gray-400); display: flex; align-items: center; gap: 5px; }
  .dp-root .browser-body { height: calc(100% - 36px); overflow-y: auto; scrollbar-width: none; position: relative; }
  .dp-root .browser-body::-webkit-scrollbar { display: none; }

  /* ── Merchant sidebar ── */
  .dp-root .m-layout { display: flex; height: 100%; }
  .dp-root .m-side { width: 170px; background: #0C1220; padding: 14px 0; flex-shrink: 0; border-right: 1px solid var(--navy-border); }
  .dp-root .m-side-logo { padding: 0 16px 14px; display: flex; align-items: center; gap: 6px; }
  .dp-root .m-side-logo svg { width: 22px; height: 22px; }
  .dp-root .m-side-logo span { color: var(--orange); font-weight: 700; font-size: 14px; }
  .dp-root .m-nav-item { padding: 9px 16px; font-size: 12px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all .2s; border-left: 3px solid transparent; }
  .dp-root .m-nav-item:hover, .dp-root .m-nav-item.active { background: rgba(255,255,255,.06); color: #fff; }
  .dp-root .m-nav-item.active { border-left-color: var(--orange); color: var(--orange); }
  .dp-root .m-nav-item svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* ── Merchant main ── */
  .dp-root .m-main { flex: 1; padding: 16px 20px; background: var(--navy); overflow-y: auto; scrollbar-width: none; }
  .dp-root .m-main::-webkit-scrollbar { display: none; }
  .dp-root .m-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .dp-root .m-header h2 { font-size: 20px; font-weight: 700; }
  .dp-root .m-header p { font-size: 11px; color: var(--gray-400); margin-top: 2px; }
  .dp-root .m-refresh { background: rgba(255,255,255,.08); border: 1px solid var(--navy-border); color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; gap: 4px; cursor: pointer; font-family: inherit; }

  /* ── QR banner ── */
  .dp-root .qr-banner { background: linear-gradient(135deg, var(--orange), #FF3D00); border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
  .dp-root .qr-banner h3 { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
  .dp-root .qr-banner p { font-size: 11px; opacity: .8; }
  .dp-root .qr-banner .qr-label { font-size: 10px; opacity: .7; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .dp-root .qr-btn { background: rgba(255,255,255,.2); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 4px; }

  /* ── Stat cards ── */
  .dp-root .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
  .dp-root .stat-card { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 14px 16px; }
  .dp-root .stat-card .label { font-size: 11px; color: var(--gray-400); margin-bottom: 6px; }
  .dp-root .stat-card .value { font-size: 26px; font-weight: 700; }
  .dp-root .stat-card .change { font-size: 10px; margin-top: 4px; }
  .dp-root .stat-card .change.green { color: var(--green); }
  .dp-root .stat-card .icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; float: right; }

  /* ── Offers section ── */
  .dp-root .offers-section { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 16px; }
  .dp-root .offers-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .dp-root .offers-header h3 { font-size: 15px; font-weight: 700; }
  .dp-root .create-offer-btn { background: var(--orange); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 4px; }
  .dp-root .offers-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--navy-border); margin-bottom: 12px; }
  .dp-root .offer-tab { padding: 8px 20px; font-size: 12px; color: var(--gray-400); cursor: pointer; border-bottom: 2px solid transparent; transition: all .2s; }
  .dp-root .offer-tab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .dp-root .offers-empty { text-align: center; padding: 30px; color: var(--gray-400); font-size: 13px; }

  /* ── Create offer form ── */
  .dp-root .form-page { padding: 16px 20px; background: var(--navy); }
  .dp-root .form-back { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gray-400); cursor: pointer; margin-bottom: 16px; background: rgba(255,255,255,.06); border: 1px solid var(--navy-border); padding: 6px 12px; border-radius: 6px; width: fit-content; }
  .dp-root .form-header h2 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
  .dp-root .form-header p { font-size: 11px; color: var(--gray-400); margin-bottom: 16px; }
  .dp-root .form-layout { display: flex; gap: 20px; }
  .dp-root .form-left { flex: 1; }
  .dp-root .form-right { width: 200px; flex-shrink: 0; }
  .dp-root .form-card { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
  .dp-root .form-card h3 { font-size: 13px; font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; color: var(--orange); }
  .dp-root .form-card h3 .ico { font-size: 14px; }
  .dp-root .form-card .sub { font-size: 10px; color: var(--gray-400); margin-bottom: 12px; }
  .dp-root .f-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .dp-root .f-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
  .dp-root .f-group { margin-bottom: 0; }
  .dp-root .f-group label { display: block; font-size: 10px; font-weight: 600; color: var(--gray-400); margin-bottom: 4px; }
  .dp-root .f-group label .req { color: var(--orange); }
  .dp-root .f-input { width: 100%; padding: 7px 10px; background: rgba(255,255,255,.04); border: 1px solid var(--navy-border); border-radius: 6px; font-size: 12px; color: #fff; font-family: inherit; }
  .dp-root .f-input:focus { outline: none; border-color: var(--orange); }
  .dp-root .f-input.highlight { border-color: var(--orange); box-shadow: 0 0 0 2px rgba(255,111,49,.2); }
  .dp-root select.f-input { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239CA3AF' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; background-color: rgba(255,255,255,.04); }

  /* ── Discount type chips ── */
  .dp-root .disc-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
  .dp-root .disc-chip { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid var(--navy-border); color: var(--gray-400); cursor: pointer; display: flex; align-items: center; gap: 4px; background: transparent; }
  .dp-root .disc-chip.active { background: var(--green); border-color: var(--green); color: #fff; }

  /* ── Geofencing ── */
  .dp-root .geo-card { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 16px; margin-bottom: 12px; }
  .dp-root .geo-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .dp-root .geo-header .geo-icon { width: 24px; height: 24px; background: var(--orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .dp-root .geo-header h3 { font-size: 13px; font-weight: 700; }
  .dp-root .geo-header p { font-size: 10px; color: var(--gray-400); }
  .dp-root .toggle-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .dp-root .toggle-row .t-label { font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .dp-root .toggle-row .t-label .t-icon { width: 18px; height: 18px; background: var(--orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; }
  .dp-root .toggle { width: 42px; height: 22px; border-radius: 11px; position: relative; cursor: pointer; }
  .dp-root .toggle.off { background: var(--navy-border); }
  .dp-root .toggle.on { background: var(--orange); }
  .dp-root .toggle::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 2px; transition: left .2s; }
  .dp-root .toggle.off::after { left: 2px; }
  .dp-root .toggle.on::after { left: 22px; }
  .dp-root .geo-radius { font-size: 12px; margin-top: 6px; }
  .dp-root .geo-radius .rlabel { color: var(--orange); font-weight: 600; font-size: 11px; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .dp-root .radius-tag { display: inline-block; background: rgba(255,255,255,.08); border: 1px solid var(--navy-border); padding: 4px 10px; border-radius: 6px; font-size: 11px; color: var(--gray-400); }

  /* ── Form buttons ── */
  .dp-root .form-actions { display: flex; gap: 10px; margin-top: 8px; }
  .dp-root .f-cancel { flex: 1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; background: rgba(255,255,255,.06); border: 1px solid var(--navy-border); color: #fff; }
  .dp-root .f-submit { flex: 2; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; background: var(--orange); border: none; color: #fff; display: flex; align-items: center; justify-content: center; gap: 6px; }

  /* ── Offer Preview panel ── */
  .dp-root .preview-panel { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 14px; position: sticky; top: 0; }
  .dp-root .preview-panel h3 { font-size: 12px; font-weight: 700; color: var(--orange); margin-bottom: 10px; display: flex; align-items: center; gap: 4px; }
  .dp-root .preview-panel .pv-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
  .dp-root .preview-panel .pv-price { font-size: 11px; color: var(--gray-400); margin-bottom: 10px; }
  .dp-root .preview-panel .pv-savings { background: rgba(16,185,129,.1); border: 1px solid rgba(16,185,129,.2); border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
  .dp-root .preview-panel .pv-savings .ps-label { font-size: 10px; color: var(--green); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 3px; }
  .dp-root .preview-panel .pv-savings .ps-val { font-size: 12px; font-weight: 700; color: var(--green); }
  .dp-root .preview-panel .pv-duration { background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.2); border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
  .dp-root .preview-panel .pv-duration .pd-label { font-size: 10px; color: var(--blue); font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 3px; }
  .dp-root .preview-panel .pv-duration .pd-val { font-size: 10px; color: rgba(255,255,255,.7); line-height: 1.4; }
  .dp-root .preview-panel .pv-type { font-size: 11px; color: var(--gray-400); margin-top: 4px; }
  .dp-root .preview-panel .pv-type strong { color: #fff; font-weight: 600; }

  /* ── Offers grid ── */
  .dp-root .offers-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .dp-root .offer-card { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; overflow: hidden; position: relative; }
  .dp-root .offer-card.new-card { border-color: var(--orange); box-shadow: 0 0 0 1px var(--orange); }
  .dp-root .offer-card-img { height: 110px; background: #1a2540; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
  .dp-root .offer-card-img img { width: 100%; height: 100%; object-fit: cover; }
  .dp-root .offer-card-img .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 36px; }
  .dp-root .oc-badge { position: absolute; top: 8px; left: 8px; background: var(--orange); color: #fff; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
  .dp-root .oc-status { position: absolute; top: 8px; right: 8px; font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
  .dp-root .oc-status.scheduled { background: var(--blue); color: #fff; }
  .dp-root .oc-status.expired { background: var(--gray-500); color: #fff; }
  .dp-root .oc-geo { position: absolute; bottom: 8px; right: 8px; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,.5); color: #fff; display: flex; align-items: center; gap: 2px; }
  .dp-root .offer-card-body { padding: 10px 12px; }
  .dp-root .offer-card-body h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .dp-root .offer-card-body .oc-product { font-size: 10px; color: var(--gray-400); margin-bottom: 6px; }
  .dp-root .offer-card-body .oc-dates { font-size: 10px; color: var(--gray-500); line-height: 1.5; }
  .dp-root .offer-card-body .oc-dates strong { color: var(--gray-400); }
  .dp-root .offer-card-body .oc-claims { font-size: 10px; color: var(--gray-400); margin-top: 4px; }
  .dp-root .oc-actions { display: flex; gap: 6px; padding: 0 12px 10px; }
  .dp-root .oc-actions button { flex: 1; padding: 6px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; font-family: inherit; border: 1px solid var(--navy-border); color: #fff; background: transparent; text-align: center; }
  .dp-root .oc-actions .view-btn { background: var(--orange); border-color: var(--orange); }

  /* ── Offer detail ── */
  .dp-root .detail-top { display: flex; gap: 12px; margin-bottom: 16px; }
  .dp-root .detail-top button { display: flex; align-items: center; gap: 6px; font-size: 12px; background: rgba(255,255,255,.06); border: 1px solid var(--navy-border); padding: 6px 12px; border-radius: 6px; color: var(--gray-400); cursor: pointer; font-family: inherit; }
  .dp-root .detail-layout { display: flex; gap: 16px; }
  .dp-root .detail-left { flex: 1; }
  .dp-root .detail-right { width: 240px; flex-shrink: 0; }
  .dp-root .detail-card { background: var(--navy-card); border: 1px solid var(--navy-border); border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  .dp-root .detail-card .d-row { display: flex; align-items: center; gap: 8px; }
  .dp-root .d-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .dp-root .d-badge.scheduled { background: var(--blue); color: #fff; }
  .dp-root .d-disc { font-size: 14px; font-weight: 700; margin-left: 6px; }
  .dp-root .d-btn-row { display: flex; gap: 8px; margin-left: auto; }
  .dp-root .d-btn { padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 4px; border: 1px solid var(--navy-border); background: transparent; color: #fff; }
  .dp-root .d-btn.edit { border-color: var(--yellow); color: var(--yellow); }
  .dp-root .d-btn.pause { border-color: var(--blue); color: var(--blue); }
  .dp-root .d-btn.delete { border-color: var(--red); color: var(--red); }
  .dp-root .assoc-product { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
  .dp-root .assoc-product .ap-img { width: 50px; height: 50px; background: var(--navy); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; overflow: hidden; }
  .dp-root .ap-info { flex: 1; }
  .dp-root .ap-info .name { font-size: 13px; font-weight: 600; }
  .dp-root .ap-info .price { font-size: 11px; color: var(--gray-400); }
  .dp-root .ap-link { font-size: 11px; color: var(--orange); font-weight: 600; }
  .dp-root .stat-section h4 { font-size: 12px; font-weight: 700; color: var(--orange); margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
  .dp-root .stat-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 11px; }
  .dp-root .stat-row:last-child { border-bottom: none; }
  .dp-root .stat-row .sr-label { color: var(--gray-400); display: flex; align-items: center; gap: 4px; }
  .dp-root .stat-row .sr-val { font-weight: 600; }
  .dp-root .geo-section h4 { font-size: 12px; font-weight: 700; color: var(--orange); margin-bottom: 8px; display: flex; align-items: center; gap: 4px; }
  .dp-root .geo-tag { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .dp-root .geo-tag.enabled { background: rgba(16,185,129,.15); color: var(--green); }

  /* ── Phone mockup ── */
  .dp-root .phone { width: 300px; height: 610px; background: #fff; border-radius: 36px; box-shadow: 0 25px 50px -12px rgba(0,0,0,.5); overflow: hidden; position: relative; border: 2px solid rgba(255,255,255,.1); }
  .dp-root .phone-bar { height: 40px; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 11px; font-weight: 600; color: #333; }
  .dp-root .phone-screen { height: calc(100% - 40px); overflow-y: auto; overflow-x: hidden; scrollbar-width: none; background: #f5f7fa; }
  .dp-root .phone-screen::-webkit-scrollbar { display: none; }

  /* ── Consumer app components ── */
  .dp-root .app-head { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background: #fff; position: sticky; top: 0; z-index: 10; }
  .dp-root .app-logo { color: var(--orange); font-weight: 700; font-size: 16px; }
  .dp-root .app-sect { padding: 14px; }
  .dp-root .app-sect-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .dp-root .app-sect-title { font-size: 16px; font-weight: 700; color: #1a1a1a; display: flex; align-items: center; gap: 6px; }
  .dp-root .app-sect-sub { font-size: 11px; color: #999; margin-top: 2px; }
  .dp-root .app-more { font-size: 11px; color: var(--orange); font-weight: 600; border: 1px solid var(--orange); padding: 3px 10px; border-radius: 50px; background: none; cursor: pointer; font-family: inherit; white-space: nowrap; }
  .dp-root .app-scroll { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
  .dp-root .app-scroll::-webkit-scrollbar { display: none; }

  /* deal card */
  .dp-root .dc { width: 160px; flex-shrink: 0; background: #fff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.08); overflow: hidden; }
  .dp-root .dc.hl { box-shadow: 0 0 0 2px var(--orange), 0 4px 12px rgba(255,111,49,.25); animation: pGlow 2s ease-in-out infinite; }
  @keyframes pGlow { 0%, 100% { box-shadow: 0 0 0 2px var(--orange), 0 4px 12px rgba(255,111,49,.25); } 50% { box-shadow: 0 0 0 3px var(--orange), 0 4px 20px rgba(255,111,49,.45); } }
  .dp-root .dc-img { height: 100px; position: relative; overflow: hidden; }
  .dp-root .dc-img .ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 30px; }
  .dp-root .dc-badge { position: absolute; top: 6px; right: 6px; background: var(--orange); color: #fff; font-size: 9px; font-weight: 700; padding: 3px 6px; border-radius: 50px; }
  .dp-root .dc-new { position: absolute; top: 6px; left: 6px; background: var(--green); color: #fff; font-size: 8px; font-weight: 700; padding: 2px 5px; border-radius: 3px; text-transform: uppercase; letter-spacing: .5px; }
  .dp-root .dc-dist { position: absolute; bottom: 6px; left: 6px; background: rgba(0,0,0,.6); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 50px; }
  .dp-root .dc-body { padding: 8px 10px; }
  .dp-root .dc-body .biz { font-size: 9px; color: #999; text-transform: uppercase; letter-spacing: .3px; }
  .dp-root .dc-body .ttl { font-size: 12px; font-weight: 700; color: #1a1a1a; margin: 2px 0; }
  .dp-root .dc-body .pr { display: flex; align-items: baseline; gap: 4px; margin-top: 3px; }
  .dp-root .dc-body .pr .sale { color: var(--orange); font-weight: 700; font-size: 14px; }
  .dp-root .dc-body .pr .orig { color: #bbb; font-size: 11px; text-decoration: line-through; }
  .dp-root .dc-body .days { font-size: 9px; color: #bbb; margin-top: 3px; }

  /* notification overlay */
  .dp-root .notif-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.3); z-index: 20; display: flex; align-items: flex-start; justify-content: center; padding-top: 50px; }
  .dp-root .notif-card { background: #fff; border-radius: 14px; width: 260px; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.3); animation: slideD .4s ease; color: #1a1a1a; }
  @keyframes slideD { from { transform: translateY(-25px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .dp-root .notif-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .dp-root .notif-ico { width: 28px; height: 28px; background: var(--orange); border-radius: 7px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; }
  .dp-root .notif-app { font-size: 11px; font-weight: 700; }
  .dp-root .notif-time { font-size: 9px; color: #999; }
  .dp-root .notif-title { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
  .dp-root .notif-body { font-size: 11px; color: #666; line-height: 1.4; }

  /* deal detail */
  .dp-root .dd-header { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #fff; position: sticky; top: 0; z-index: 10; }
  .dp-root .dd-back { font-size: 16px; color: #666; }
  .dp-root .dd-title { color: var(--orange); font-size: 14px; font-weight: 600; }
  .dp-root .dd-hero { height: 180px; position: relative; }
  .dp-root .dd-hero .ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 56px; }
  .dp-root .dd-disc { position: absolute; top: 12px; left: 12px; width: 48px; height: 48px; background: var(--orange); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; font-weight: 700; }
  .dp-root .dd-disc .pct { font-size: 14px; line-height: 1; }
  .dp-root .dd-disc .off { font-size: 8px; }
  .dp-root .dd-body { padding: 14px; background: #fff; }
  .dp-root .dd-offer { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 3px; }
  .dp-root .dd-rem { font-size: 11px; color: #999; margin-bottom: 10px; }
  .dp-root .dd-price-card { background: #f5f7fa; border-radius: 8px; padding: 12px; display: flex; align-items: baseline; gap: 6px; margin-bottom: 10px; }
  .dp-root .dd-price-card .sale { font-size: 22px; font-weight: 700; color: var(--orange); }
  .dp-root .dd-price-card .was { font-size: 13px; color: #bbb; text-decoration: line-through; }
  .dp-root .dd-price-card .save { font-size: 12px; color: var(--green); font-weight: 600; }
  .dp-root .dd-info { background: #EFF6FF; border-radius: 8px; padding: 10px; display: flex; gap: 8px; margin-bottom: 10px; }
  .dp-root .dd-info .ii { width: 18px; height: 18px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0; }
  .dp-root .dd-info h4 { font-size: 12px; font-weight: 600; color: #3B82F6; margin-bottom: 1px; }
  .dp-root .dd-info p { font-size: 10px; color: #999; line-height: 1.4; }
  .dp-root .dd-claim { width: 100%; padding: 12px; background: var(--orange); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: inherit; margin-bottom: 10px; }
  .dp-root .dd-btns { display: flex; gap: 8px; margin-bottom: 12px; }
  .dp-root .dd-btns button { flex: 1; padding: 8px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; font-family: inherit; color: #666; }
  .dp-root .dd-sect { background: #f5f7fa; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
  .dp-root .dd-sect h4 { font-size: 12px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .dp-root .dd-sect p { font-size: 11px; color: #999; line-height: 1.4; }
  .dp-root .dd-biz-name { font-size: 13px; font-weight: 600; color: #1a1a1a; margin-bottom: 4px; }
  .dp-root .dd-biz-info { font-size: 11px; color: #999; display: flex; align-items: center; gap: 4px; margin-bottom: 3px; }

  /* claim success */
  .dp-root .claim-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background: #fff; }
  .dp-root .claim-check { width: 52px; height: 52px; background: var(--green); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; margin-bottom: 14px; }
  .dp-root .claim-screen h3 { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .dp-root .claim-detail { font-size: 12px; color: #999; margin-bottom: 16px; }
  .dp-root .qr-box { width: 120px; height: 120px; border: 2px solid #e5e7eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; padding: 8px; }
  .dp-root .claim-id { font-size: 10px; color: #bbb; font-family: monospace; letter-spacing: 1px; margin-bottom: 14px; }
  .dp-root .claim-inst { font-size: 11px; color: #999; line-height: 1.5; max-width: 200px; }

  /* bottom nav */
  .dp-root .app-bnav { display: flex; position: sticky; bottom: 0; background: #fff; border-top: 1px solid #e5e7eb; z-index: 10; }
  .dp-root .bnav-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 6px 0; font-size: 9px; color: #bbb; gap: 1px; }
  .dp-root .bnav-item.active { color: var(--orange); }
  .dp-root .bnav-item svg { width: 18px; height: 18px; }

  /* ── Transition / success ── */
  .dp-root .center-content { text-align: center; color: #fff; }
  .dp-root .center-content h2 { font-size: 38px; font-weight: 700; margin-bottom: 12px; }
  .dp-root .center-content h2 span { color: var(--orange); }
  .dp-root .center-content p { font-size: 17px; color: rgba(255,255,255,.5); max-width: 420px; margin: 0 auto; }
  .dp-root .success-check { width: 70px; height: 70px; background: var(--green); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 34px; color: #fff; animation: popIn .6s ease; }
  @keyframes popIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
  .dp-root .trans-icon { font-size: 54px; margin-bottom: 16px; animation: floatA 2s ease-in-out infinite; }
  @keyframes floatA { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  /* closing */
  .dp-root .closing-stats { display: flex; gap: 36px; justify-content: center; margin: 28px 0; }
  .dp-root .cs-item { text-align: center; }
  .dp-root .cs-item .num { font-size: 32px; font-weight: 700; color: var(--orange); }
  .dp-root .cs-item .lbl { font-size: 13px; color: rgba(255,255,255,.4); }
  .dp-root .closing-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--orange); color: #fff; border: none; padding: 14px 32px; border-radius: 60px; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; margin-top: 8px; }

  @media(max-width: 1000px) {
    .dp-root .ctx { flex-direction: column; gap: 24px; text-align: center; }
    .dp-root .ctx-p { margin: 0 auto; }
    .dp-root .browser { width: 100%; max-width: 660px; height: 380px; }
  }
`

// Shared sidebar used on steps 1-4
function MerchantSidebar({ activeItem }: { activeItem: 'dashboard' | 'offers' }) {
  return (
    <div className="m-side">
      <div className="m-side-logo">
        <svg viewBox="0 0 24 24" fill="var(--orange)">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
        </svg>
        <span>PopupReach</span>
      </div>
      <div className={`m-nav-item${activeItem === 'dashboard' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Dashboard
      </div>
      <div className={`m-nav-item${activeItem === 'offers' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
        Offers
      </div>
      <div className="m-nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Redeem
      </div>
      <div className="m-nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Products
      </div>
      <div className="m-nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20V10M18 20V4M6 20v-4" />
        </svg>
        Analytics
      </div>
      <div className="m-nav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33" />
        </svg>
        Settings
      </div>
    </div>
  )
}

function PhoneBar() {
  return (
    <div className="phone-bar">
      <span>9:41</span>
      <span style={{ display: 'flex', gap: 4 }}>
        <svg width="14" height="10" viewBox="0 0 16 12" fill="#333">
          <path d="M1 8h2v4H1zM5 5h2v7H5zM9 3h2v9H9zM13 0h2v12h-2z" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 16 12" fill="#333">
          <rect x="0" y="3" width="12" height="7" rx="1.5" stroke="#333" fill="none" strokeWidth="1" />
          <rect x="12.5" y="5" width="1.5" height="3" rx=".5" />
          <rect x="1.5" y="4.5" width="8" height="4" rx=".5" fill="#333" />
        </svg>
      </span>
    </div>
  )
}

function AppBottomNav({ active = 'home' }: { active?: string }) {
  return (
    <div className="app-bnav">
      <div className={`bnav-item${active === 'home' ? ' active' : ''}`}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
        </svg>
        Home
      </div>
      <div className="bnav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
        </svg>
        Nearby
      </div>
      <div className="bnav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6M12 2v13M5 9l7 7 7-7" />
        </svg>
        Claims
      </div>
      <div className="bnav-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        Profile
      </div>
    </div>
  )
}

export default function DemoPage() {
  const curRef = useRef(0)
  const stepEls = useRef<(HTMLDivElement | null)[]>([])
  const browserEls = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null])
  const progressBarRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<(HTMLDivElement | null)[]>([])
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const prevBtnRef = useRef<HTMLButtonElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const clickTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const updateUI = useCallback(() => {
    const cur = curRef.current
    if (progressBarRef.current) {
      progressBarRef.current.style.width = ((cur / (TOTAL - 1)) * 100) + '%'
    }
    dotsRef.current.forEach((d, i) => {
      if (!d) return
      d.className = 'step-dot'
      if (i === cur) d.classList.add('active')
      else if (i < cur) d.classList.add('completed')
    })
    if (prevBtnRef.current) prevBtnRef.current.style.display = cur > 0 ? 'flex' : 'none'
    if (nextBtnRef.current) nextBtnRef.current.style.display = (cur > 0 && cur < TOTAL - 1) ? 'flex' : 'none'
  }, [])

  const hideCursor = useCallback(() => {
    cursorRef.current?.classList.remove('visible')
    labelRef.current?.classList.remove('visible')
  }, [])

  const showCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return
    cursorRef.current.style.left = x + 'px'
    cursorRef.current.style.top = y + 'px'
    cursorRef.current.classList.add('visible')
  }, [])

  const fireClick = useCallback((x: number, y: number) => {
    if (!ringRef.current) return
    ringRef.current.style.left = x + 'px'
    ringRef.current.style.top = y + 'px'
    ringRef.current.classList.remove('fire')
    void ringRef.current.offsetWidth
    ringRef.current.classList.add('fire')
  }, [])

  const showLabel = useCallback((x: number, y: number, text: string) => {
    if (!labelRef.current) return
    labelRef.current.textContent = text
    labelRef.current.style.top = (y - 36) + 'px'
    labelRef.current.classList.add('visible')
    const lw = labelRef.current.offsetWidth || 140
    const maxX = window.innerWidth - lw - 16
    labelRef.current.style.left = Math.min(x, maxX) + 'px'
  }, [])

  const runClickSequence = useCallback((step: number) => {
    hideCursor()
    const seqs: Record<number, { t: number; x: string; y: string; label: string }[]> = {
      1: [{ t: 300, x: '72%', y: '62%', label: 'Click "+ Create offer"' }],
      2: [
        { t: 300, x: '38%', y: '26%', label: 'Select product: Nike shoes' },
        { t: 2000, x: '33%', y: '43%', label: 'Set discount to 30%' },
        { t: 4000, x: '56%', y: '87%', label: 'Enable geofencing (500m)' },
        { t: 6000, x: '62%', y: '92%', label: 'Click "Create Offer"' },
      ],
      3: [{ t: 300, x: '35%', y: '87%', label: 'Click "View Details"' }],
      4: [{ t: 300, x: '72%', y: '39%', label: 'View offer statistics' }],
    }
    const seq = seqs[step]
    if (!seq) return
    const browser = browserEls.current[step]
    if (!browser) return

    seq.forEach(({ t, x, y, label: lbl }) => {
      const tid = setTimeout(() => {
        const rect = browser.getBoundingClientRect()
        const px = rect.left + rect.width * parseFloat(x) / 100
        const py = rect.top + rect.height * parseFloat(y) / 100
        showCursor(px, py)
        showLabel(px, py, lbl)
        const tid2 = setTimeout(() => fireClick(px, py), 300)
        clickTimeoutsRef.current.push(tid2)
      }, t)
      clickTimeoutsRef.current.push(tid)
    })
    const lastT = seq[seq.length - 1].t
    const hideId = setTimeout(hideCursor, lastT + 2500)
    clickTimeoutsRef.current.push(hideId)
  }, [hideCursor, showCursor, showLabel, fireClick])

  const goToStep = useCallback((n: number) => {
    const cur = curRef.current
    if (n === cur || n < 0 || n >= TOTAL) return
    hideCursor()
    clickTimeoutsRef.current.forEach(clearTimeout)
    clickTimeoutsRef.current = []

    const oldEl = stepEls.current[cur]
    const newEl = stepEls.current[n]
    if (!oldEl || !newEl) return

    oldEl.classList.remove('active')
    oldEl.style.transform = n > cur ? 'translateX(-50px)' : 'translateX(50px)'
    newEl.style.removeProperty('opacity')
    newEl.style.removeProperty('transform')
    newEl.style.transform = n > cur ? 'translateX(50px)' : 'translateX(-50px)'

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newEl.classList.add('active')
        newEl.style.removeProperty('transform')
      })
    })
    setTimeout(() => {
      oldEl.style.removeProperty('transform')
      oldEl.style.removeProperty('opacity')
    }, 600)

    curRef.current = n
    updateUI()
    if (n >= 1 && n <= 4) setTimeout(() => runClickSequence(n), 600)
  }, [hideCursor, updateUI, runClickSequence])

  useEffect(() => {
    // Init first step active
    if (stepEls.current[0]) stepEls.current[0].classList.add('active')
    updateUI()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        curRef.current === 0 ? goToStep(1) : goToStep(curRef.current + 1)
      }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToStep(curRef.current - 1) }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      clickTimeoutsRef.current.forEach(clearTimeout)
    }
  }, [goToStep, updateUI])

  const setStepRef = (i: number) => (el: HTMLDivElement | null) => { stepEls.current[i] = el }
  const setDotRef = (i: number) => (el: HTMLDivElement | null) => { dotsRef.current[i] = el }
  const setBrowserRef = (i: number) => (el: HTMLDivElement | null) => { browserEls.current[i] = el }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: DEMO_CSS }} />
      <div className="dp-root">
        <div className="demo">
          <div className="progress-bar" ref={progressBarRef} />
          <div className="step-counter">
            {Array.from({ length: TOTAL }, (_, i) => (
              <div key={i} className="step-dot" ref={setDotRef(i)} onClick={() => goToStep(i)} />
            ))}
          </div>

          {/* Cursor & click ring */}
          <div className="cursor-dot" ref={cursorRef}>
            <svg viewBox="0 0 24 24">
              <path d="M5.5 3.21V20.8a.5.5 0 00.85.36l4.44-4.44h7.21a.5.5 0 00.35-.85L5.86 3.35a.5.5 0 00-.36.14z" fill="#fff" stroke="#000" strokeWidth="1" />
            </svg>
          </div>
          <div className="click-ring" ref={ringRef} />
          <div className="action-label" ref={labelRef} />

          {/* ── STEP 0: INTRO ── */}
          <div className="step" ref={setStepRef(0)}>
            <div className="intro-content">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/logos/default.png" alt="PopupReach" className="intro-logo" />
              <div className="intro-tagline">Location-Based Deals Platform</div>
              <h1 className="intro-title">See How <span>PopupReach</span> Works</h1>
              <p className="intro-subtitle">Watch a merchant create a live promotion and a nearby customer discover and redeem it — all in real time.</p>
              <button className="intro-start" onClick={() => goToStep(1)}>
                Start Demo
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── STEP 1: MERCHANT DASHBOARD ── */}
          <div className="step" ref={setStepRef(1)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Merchant Portal</div>
                <h2 className="ctx-h">The Business <span>Dashboard</span></h2>
                <p className="ctx-p">The merchant logs into their PopupReach business portal. They see active offers, claims, products, and a QR code for in-store use.</p>
              </div>
              <div className="ctx-mockup">
                <div className="browser" ref={setBrowserRef(1)}>
                  <div className="browser-bar">
                    <div className="browser-dots"><span /><span /><span /></div>
                    <div className="browser-url"><span style={{ color: '#27C93F' }}>🔒</span>business.popupreach.com/dashboard</div>
                  </div>
                  <div className="browser-body">
                    <div className="m-layout">
                      <MerchantSidebar activeItem="dashboard" />
                      <div className="m-main">
                        <div className="m-header">
                          <div><h2>Dashboard</h2><p>Manage your business promotions and track performance</p></div>
                          <button className="m-refresh">↻ Refresh</button>
                        </div>
                        <div className="qr-banner">
                          <div>
                            <div className="qr-label">📎 Business QR Code</div>
                            <h3>Get Customers Scanning!</h3>
                            <p>Generate a QR code for your business. Customers can scan it to view all your offers.</p>
                          </div>
                          <button className="qr-btn">📎 Generate QR Code</button>
                        </div>
                        <div className="stats-row">
                          <div className="stat-card">
                            <div className="label">Active Offers</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="value">0</div>
                              <div className="icon" style={{ background: 'rgba(16,185,129,.15)', color: 'var(--green)' }}>📈</div>
                            </div>
                            <div className="change green">+12% vs last month</div>
                          </div>
                          <div className="stat-card">
                            <div className="label">Claims</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="value">1</div>
                              <div className="icon" style={{ background: 'rgba(139,92,246,.15)', color: 'var(--purple)' }}>🎁</div>
                            </div>
                            <div className="change green">+8% vs last month</div>
                          </div>
                          <div className="stat-card">
                            <div className="label">Products</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div className="value">4</div>
                              <div className="icon" style={{ background: 'rgba(59,130,246,.15)', color: 'var(--blue)' }}>📦</div>
                            </div>
                            <div className="change green">+3% vs last month</div>
                          </div>
                        </div>
                        <div className="offers-section">
                          <div className="offers-header">
                            <h3>Offers<br /><span style={{ fontSize: 10, fontWeight: 400, color: 'var(--gray-400)' }}>Recent promotional offers</span></h3>
                            <button className="create-offer-btn">+ Create offer</button>
                          </div>
                          <div className="offers-tabs">
                            <div className="offer-tab active">Active</div>
                            <div className="offer-tab">Expired</div>
                            <div className="offer-tab">Scheduled</div>
                          </div>
                          <div className="offers-empty">No active offers yet. Click &quot;+ Create offer&quot; to get started.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 2: CREATE OFFER FORM ── */}
          <div className="step" ref={setStepRef(2)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Creating an Offer</div>
                <h2 className="ctx-h">Select a <span>Product</span></h2>
                <p className="ctx-p">The merchant clicks the product dropdown and selects &quot;Nike shoes — $500.00&quot; from their product catalogue.</p>
              </div>
              <div className="ctx-mockup">
                <div className="browser" ref={setBrowserRef(2)}>
                  <div className="browser-bar">
                    <div className="browser-dots"><span /><span /><span /></div>
                    <div className="browser-url"><span style={{ color: '#27C93F' }}>🔒</span>business.popupreach.com/offers/new</div>
                  </div>
                  <div className="browser-body">
                    <div className="m-layout">
                      <MerchantSidebar activeItem="offers" />
                      <div className="m-main">
                        <div className="form-page" style={{ padding: 0 }}>
                          <div className="form-back">← Back</div>
                          <div className="form-header"><h2>Create Offer</h2><p>Create a promotional offer for your products</p></div>
                          <div className="form-layout">
                            <div className="form-left">
                              <div className="form-card">
                                <h3><span className="ico">📋</span> Offer Details</h3>
                                <div className="sub">Configure your promotional offer</div>
                                <div className="f-row">
                                  <div className="f-group">
                                    <label>Product <span className="req">*</span></label>
                                    <select className="f-input highlight" defaultValue="Nike shoes — $500.00">
                                      <option>Nike shoes — $500.00</option>
                                    </select>
                                  </div>
                                  <div className="f-group">
                                    <label>Offer Title (Optional)</label>
                                    <input className="f-input" defaultValue="Auto-generated if blank" readOnly />
                                  </div>
                                  <div className="f-group">
                                    <label>Description</label>
                                    <input className="f-input" defaultValue="Brief description" readOnly />
                                  </div>
                                </div>
                                <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', marginBottom: 6, display: 'block' }}>
                                  Discount Type <span className="req">*</span>
                                </label>
                                <div className="disc-chips">
                                  <div className="disc-chip active">✓ Percentage</div>
                                  <div className="disc-chip">$ Fixed Amount</div>
                                  <div className="disc-chip">$ Min Purchase</div>
                                  <div className="disc-chip">📦 Bulk Discount</div>
                                  <div className="disc-chip">🎁 BOGO</div>
                                </div>
                                <div className="f-row-2">
                                  <div className="f-group">
                                    <label>Discount Percentage <span className="req">*</span></label>
                                    <input className="f-input highlight" defaultValue="30" readOnly style={{ fontWeight: 700 }} />
                                  </div>
                                  <div className="f-group">
                                    <label>%</label>
                                    <div style={{ padding: '7px 0', fontSize: 12, color: 'var(--gray-400)' }}>of product price</div>
                                  </div>
                                </div>
                                <div className="f-row-2">
                                  <div className="f-group"><label>📅 Start Date <span className="req">*</span></label><input className="f-input" defaultValue="2026-03-10" readOnly /></div>
                                  <div className="f-group"><label>📅 End Date <span className="req">*</span></label><input className="f-input" defaultValue="2026-04-11" readOnly /></div>
                                </div>
                                <div className="f-row-2">
                                  <div className="f-group"><label>Start Time <span className="req">*</span></label><input className="f-input" defaultValue="09:01 AM" readOnly /></div>
                                  <div className="f-group"><label>End Time <span className="req">*</span></label><input className="f-input" defaultValue="11:00 PM" readOnly /></div>
                                </div>
                                <div className="f-row-2">
                                  <div className="f-group"><label>Maximum Claims (Optional)</label><input className="f-input" defaultValue="200" readOnly /></div>
                                  <div className="f-group"><label>Max Claims Per User (Optional)</label><input className="f-input" defaultValue="2" readOnly /></div>
                                </div>
                                <div className="f-row-2">
                                  <div className="f-group"><label>Min Claims Per Customer (Optional)</label><input className="f-input" defaultValue="1" readOnly /></div>
                                  <div className="f-group" />
                                </div>
                              </div>
                              <div className="geo-card">
                                <div className="geo-header">
                                  <div className="geo-icon">📍</div>
                                  <div><h3>Geofencing Controls</h3><p style={{ fontSize: 10, color: 'var(--gray-400)' }}>Target customers based on their location</p></div>
                                </div>
                                <div className="toggle-row">
                                  <div className="t-label">
                                    <div className="t-icon">📍</div>
                                    Enable Geofencing<br />
                                    <span style={{ fontSize: 9, color: 'var(--gray-400)', display: 'block' }}>Target customers near your location</span>
                                  </div>
                                  <div className="toggle on" />
                                </div>
                                <div className="geo-radius">
                                  <div className="rlabel">📍 Targeting Radius</div>
                                  <div className="radius-tag">500m — Walking distance</div>
                                </div>
                              </div>
                              <div className="form-actions">
                                <button className="f-cancel">Cancel</button>
                                <button className="f-submit">🚀 Create Offer</button>
                              </div>
                            </div>
                            <div className="form-right">
                              <div className="preview-panel">
                                <h3>📎 Offer Preview</h3>
                                <div className="pv-name">Nike shoes</div>
                                <div className="pv-price">Original Price: $500.00</div>
                                <div className="pv-savings">
                                  <div className="ps-label">$ Savings Preview</div>
                                  <div className="ps-val">Save $150.00 (30% off $500.00)</div>
                                </div>
                                <div className="pv-duration">
                                  <div className="pd-label">📅 Offer Duration</div>
                                  <div className="pd-val">Mar 10, 2026, 9:01 AM — Apr 11, 2026, 11:00 PM<br />Limited to 200 total claims<br />Max 2 claim(s) per user</div>
                                </div>
                                <div className="pv-type"><strong>Discount Type: Percentage</strong><br /><span style={{ fontSize: 10 }}>Customer gets a percentage off the product price</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 3: OFFER CREATED – OFFERS GRID ── */}
          <div className="step" ref={setStepRef(3)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Offers Page</div>
                <h2 className="ctx-h">Offer <span>Created!</span></h2>
                <p className="ctx-p">The new &quot;30% Off Nike shoes&quot; offer appears in the offers grid as a Scheduled offer, ready to go live at the start time.</p>
              </div>
              <div className="ctx-mockup">
                <div className="browser" ref={setBrowserRef(3)}>
                  <div className="browser-bar">
                    <div className="browser-dots"><span /><span /><span /></div>
                    <div className="browser-url"><span style={{ color: '#27C93F' }}>🔒</span>business.popupreach.com/offers</div>
                  </div>
                  <div className="browser-body">
                    <div className="m-layout">
                      <MerchantSidebar activeItem="offers" />
                      <div className="m-main">
                        <div className="m-header">
                          <div><h2>Offers</h2><p>Manage your promotional offers and track performance</p></div>
                          <button className="create-offer-btn">+ Create Offer</button>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid var(--navy-border)', color: 'var(--gray-400)' }}>▾ All Products</div>
                          <div style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid var(--navy-border)', color: 'var(--gray-400)' }}>▾ All Status</div>
                          <div style={{ fontSize: 11, padding: '5px 10px', borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid var(--navy-border)', color: 'var(--gray-400)' }}>▾ Newest First</div>
                        </div>
                        <div className="offers-grid">
                          <div className="offer-card new-card">
                            <div className="offer-card-img">
                              <div className="placeholder" style={{ background: 'linear-gradient(135deg,#1a3a5c,#2a5a8c)' }}>👟</div>
                              <div className="oc-badge">30% off</div>
                              <div className="oc-status scheduled">📅 Scheduled</div>
                              <div className="oc-geo">📍 Dec 500m</div>
                            </div>
                            <div className="offer-card-body">
                              <h4>30% Off Nike shoes</h4>
                              <div className="oc-product">Product: Nike shoes</div>
                              <div className="oc-dates"><strong>Start:</strong> Mar 10, 2026, 9:01 AM<br /><strong>End:</strong> Apr 11, 2026, 11:00 PM</div>
                              <div className="oc-claims">Units Claimed: 0 / 200</div>
                            </div>
                            <div className="oc-actions">
                              <button className="view-btn">View Details</button>
                              <button>Edit</button>
                            </div>
                          </div>
                          <div className="offer-card">
                            <div className="offer-card-img">
                              <div className="placeholder" style={{ background: 'linear-gradient(135deg,#1a3a5c,#2a5a8c)' }}>👟</div>
                              <div className="oc-badge" style={{ background: 'var(--red)' }}>10% off</div>
                              <div className="oc-status expired">📅 Expired</div>
                              <div className="oc-geo">📍 Dec 250m</div>
                            </div>
                            <div className="offer-card-body">
                              <h4>10% Off Nike shoes</h4>
                              <div className="oc-product">Product: Nike shoes</div>
                              <div className="oc-dates"><strong>Start:</strong> Feb 19, 2026<br /><strong>End:</strong> Feb 19, 2026</div>
                              <div className="oc-claims">Units Claimed: 0</div>
                            </div>
                            <div className="oc-actions"><button>View Details</button><button>Edit</button></div>
                          </div>
                          <div className="offer-card">
                            <div className="offer-card-img">
                              <div className="placeholder" style={{ background: 'linear-gradient(135deg,#3a2a1a,#5a4a2a)' }}>🍝</div>
                              <div className="oc-badge" style={{ background: 'var(--yellow)', color: '#000' }}>Special</div>
                              <div className="oc-status expired">📅 Expired</div>
                              <div className="oc-geo">📍 Dec 300m</div>
                            </div>
                            <div className="offer-card-body">
                              <h4>Lunch Special</h4>
                              <div className="oc-product">Product: Spaghetti</div>
                              <div className="oc-dates"><strong>Start:</strong> Jan 21, 2026<br /><strong>End:</strong> Jan 21, 2026</div>
                              <div className="oc-claims">Units Claimed: 0</div>
                            </div>
                            <div className="oc-actions"><button>View Details</button><button>Edit</button></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 4: OFFER DETAIL ── */}
          <div className="step" ref={setStepRef(4)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Offer Management</div>
                <h2 className="ctx-h">Offer <span>Details</span></h2>
                <p className="ctx-p">The merchant views the full offer stats — claims, geofencing radius, dates, and associated product. They can edit, pause, or delete at any time.</p>
              </div>
              <div className="ctx-mockup">
                <div className="browser" ref={setBrowserRef(4)}>
                  <div className="browser-bar">
                    <div className="browser-dots"><span /><span /><span /></div>
                    <div className="browser-url"><span style={{ color: '#27C93F' }}>🔒</span>business.popupreach.com/offers/30-off-nike-shoes</div>
                  </div>
                  <div className="browser-body">
                    <div className="m-layout">
                      <MerchantSidebar activeItem="offers" />
                      <div className="m-main">
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>30% Off Nike shoes</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 12 }}>View and manage offer details</div>
                        <div className="detail-top">
                          <button>← Back to Offers</button>
                          <button>📦 Product Offers</button>
                        </div>
                        <div className="detail-layout">
                          <div className="detail-left">
                            <div className="detail-card">
                              <div className="d-row">
                                <div style={{ fontSize: 16, fontWeight: 700 }}>30% Off Nike shoes</div>
                                <div className="d-btn-row">
                                  <button className="d-btn edit">✎ Edit</button>
                                  <button className="d-btn pause">⏸ Pause</button>
                                  <button className="d-btn delete">🗑 Delete</button>
                                </div>
                              </div>
                              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="d-badge scheduled">Scheduled</span>
                                <span className="d-disc">30% off</span>
                              </div>
                            </div>
                            <div className="detail-card">
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--orange)', marginBottom: 8 }}>📦 Associated Product</div>
                              <div className="assoc-product">
                                <div className="ap-img">👟</div>
                                <div className="ap-info"><div className="name">Nike shoes</div><div className="price">Price: $500.00</div></div>
                                <div className="ap-link">View Product Offers</div>
                              </div>
                            </div>
                          </div>
                          <div className="detail-right">
                            <div className="detail-card">
                              <div className="stat-section">
                                <h4>⚡ Offer Statistics</h4>
                                <div className="stat-row"><span className="sr-label">🎁 Units Claimed</span><span className="sr-val">0 / 200 <span style={{ fontSize: 9, color: 'var(--gray-400)' }}>(200 available)</span></span></div>
                                <div className="stat-row"><span className="sr-label">📦 Min Per Claim</span><span className="sr-val" style={{ color: 'var(--blue)' }}>1 units</span></div>
                                <div className="stat-row"><span className="sr-label">👤 Max Per User</span><span className="sr-val" style={{ color: 'var(--blue)' }}>2 units</span></div>
                                <div className="stat-row"><span className="sr-label">✅ Units Redeemed</span><span className="sr-val" style={{ color: 'var(--red)' }}>0</span></div>
                                <div className="stat-row"><span className="sr-label">📅 Start Date & Time</span><span className="sr-val">Mar 10, 2026 at 9:01 AM</span></div>
                                <div className="stat-row"><span className="sr-label">📅 End Date & Time</span><span className="sr-val">Apr 11, 2026 at 11:00 PM</span></div>
                                <div className="stat-row"><span className="sr-label">📈 Offer Type</span><span className="sr-val">Percentage</span></div>
                                <div className="stat-row"><span className="sr-label">📅 Created</span><span className="sr-val">Mar 10, 2026 at 1:38 AM</span></div>
                              </div>
                            </div>
                            <div className="detail-card">
                              <div className="geo-section">
                                <h4>📍 Location & Advertising</h4>
                                <div className="stat-row"><span className="sr-label">📍 Geofencing</span><span><span className="geo-tag enabled">Enabled</span></span></div>
                                <div className="stat-row"><span className="sr-label">📎 Target Radius</span><span className="sr-val">500m</span></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 5: OFFER LIVE ── */}
          <div className="step" ref={setStepRef(5)}>
            <div className="center-content">
              <div className="success-check">✓</div>
              <h2>Offer is <span>Live!</span></h2>
              <p>&quot;30% Off Nike shoes&quot; is now scheduled and reaching customers within 500m via geofencing.</p>
            </div>
          </div>

          {/* ── STEP 6: TRANSITION ── */}
          <div className="step" ref={setStepRef(6)}>
            <div className="center-content">
              <div className="trans-icon">🚶</div>
              <h2>Meanwhile, nearby...</h2>
              <p>A customer is walking past with the PopupReach app installed on their phone.</p>
            </div>
          </div>

          {/* ── STEP 7: CONSUMER HOME + NOTIF ── */}
          <div className="step" ref={setStepRef(7)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Consumer App</div>
                <h2 className="ctx-h">A Deal <span>Pops Up</span></h2>
                <p className="ctx-p">The customer receives a real-time push notification — they&apos;re only 120m from the store. The new 30% off deal appears highlighted on their home screen.</p>
              </div>
              <div className="ctx-mockup">
                <div className="phone">
                  <PhoneBar />
                  <div className="phone-screen">
                    <div className="app-head">
                      <span className="app-logo">PopupReach</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                      </svg>
                    </div>
                    <div className="app-sect">
                      <div className="app-sect-h">
                        <div>
                          <div className="app-sect-title"><span style={{ fontSize: 18 }}>🌿</span> Deals Near You</div>
                          <div className="app-sect-sub">Offers from businesses in your area</div>
                        </div>
                        <button className="app-more">View More</button>
                      </div>
                      <div className="app-scroll">
                        <div className="dc hl">
                          <div className="dc-img">
                            <div className="ph" style={{ background: 'linear-gradient(135deg,#1a3a5c,#2a5a8c)' }}>👟</div>
                            <div className="dc-new">NEW</div>
                            <div className="dc-badge">30% OFF</div>
                            <div className="dc-dist">📍 120m</div>
                          </div>
                          <div className="dc-body">
                            <div className="biz">DOWNTOWN KICKS</div>
                            <div className="ttl">30% Off Nike shoes</div>
                            <div className="pr"><span className="sale">$350.00</span><span className="orig">$500.00</span></div>
                            <div className="days">🕐 32d left</div>
                          </div>
                        </div>
                        <div className="dc">
                          <div className="dc-img">
                            <div className="ph" style={{ background: 'linear-gradient(135deg,#1a5276,#2980b9)' }}>🍪</div>
                            <div className="dc-badge">$5 OFF</div>
                            <div className="dc-dist">📍 10m</div>
                          </div>
                          <div className="dc-body">
                            <div className="biz">THE POPUP COMPANY II</div>
                            <div className="ttl">$5 Off Cookies</div>
                            <div className="pr"><span className="sale">$15.00</span><span className="orig">$20.00</span></div>
                            <div className="days">🕐 47d left</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="app-sect" style={{ paddingTop: 0 }}>
                      <div className="app-sect-h">
                        <div>
                          <div className="app-sect-title"><span style={{ fontSize: 16 }}>🎲</span> All Deals</div>
                          <div className="app-sect-sub">Browse all available offers</div>
                        </div>
                        <button className="app-more">View More</button>
                      </div>
                      <div className="app-scroll">
                        <div className="dc" style={{ width: 120 }}>
                          <div className="dc-img" style={{ height: 80 }}>
                            <div className="ph" style={{ background: 'linear-gradient(135deg,#7B241C,#E74C3C)' }}>🍕</div>
                            <div className="dc-badge" style={{ fontSize: 8 }}>32%</div>
                          </div>
                          <div className="dc-body" style={{ padding: '6px 8px' }}>
                            <div className="biz" style={{ fontSize: 8 }}>NIAKWA PIZZA</div>
                            <div className="ttl" style={{ fontSize: 10 }}>32% OFF</div>
                            <div className="pr"><span className="sale" style={{ fontSize: 12 }}>$10.19</span><span className="orig" style={{ fontSize: 9 }}>$14.99</span></div>
                          </div>
                        </div>
                        <div className="dc" style={{ width: 120 }}>
                          <div className="dc-img" style={{ height: 80 }}>
                            <div className="ph" style={{ background: 'linear-gradient(135deg,#1B4F72,#2E86C1)' }}>🍗</div>
                            <div className="dc-badge" style={{ fontSize: 8 }}>14%</div>
                          </div>
                          <div className="dc-body" style={{ padding: '6px 8px' }}>
                            <div className="biz" style={{ fontSize: 8 }}>M&amp;M FOOD MARKET</div>
                            <div className="ttl" style={{ fontSize: 10 }}>14.3%</div>
                            <div className="pr"><span className="sale" style={{ fontSize: 12 }}>$25.68</span><span className="orig" style={{ fontSize: 9 }}>$29.97</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <AppBottomNav active="home" />
                    <div className="notif-overlay">
                      <div className="notif-card">
                        <div className="notif-head">
                          <div className="notif-ico">🔔</div>
                          <div>
                            <div className="notif-app">PopupReach</div>
                            <div className="notif-time">now</div>
                          </div>
                        </div>
                        <div className="notif-title">👟 New deal near you!</div>
                        <div className="notif-body">30% Off Nike shoes — only 120m away! Save $150.00 on your next purchase.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 8: DEAL DETAIL ── */}
          <div className="step" ref={setStepRef(8)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Consumer App</div>
                <h2 className="ctx-h">Viewing <span>Deal Details</span></h2>
                <p className="ctx-p">The customer taps the deal to see full details — the 30% discount, pricing, business location, and how to claim the offer in-store.</p>
              </div>
              <div className="ctx-mockup">
                <div className="phone">
                  <PhoneBar />
                  <div className="phone-screen" style={{ background: '#fff' }}>
                    <div className="dd-header">
                      <span className="dd-back">←</span>
                      <span className="dd-title">Discount Details</span>
                    </div>
                    <div className="dd-hero">
                      <div className="ph" style={{ background: 'linear-gradient(135deg,#1a3a5c,#2a5a8c)', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>👟</div>
                      <div className="dd-disc"><span className="pct">30%</span><span className="off">OFF</span></div>
                    </div>
                    <div className="dd-body">
                      <div className="dd-offer">30% Off Nike shoes</div>
                      <div className="dd-rem">🕐 32 days remaining</div>
                      <div className="dd-price-card">
                        <span className="sale">$350.00</span>
                        <span className="was">$500.00</span>
                        <span className="save">Save $150.00</span>
                      </div>
                      <div className="dd-info">
                        <div className="ii">i</div>
                        <div><h4>Visit Store to Claim</h4><p>This offer is available in-store only. Visit the business location to claim this special offer in person.</p></div>
                      </div>
                      <button className="dd-claim">🎉 Claim This Offer</button>
                      <div className="dd-btns">
                        <button>❤️ Favorite</button>
                        <button>🔗 Share</button>
                      </div>
                      <div className="dd-sect"><h4>About this offer</h4><p>Get 30% off Nike shoes. Limited to 200 claims. Maximum 2 per customer. Valid in-store only.</p></div>
                      <div className="dd-sect">
                        <h4>Business Information</h4>
                        <div className="dd-biz-name">Downtown Kicks</div>
                        <div className="dd-biz-info">📍 456 Main St, Winnipeg, MB</div>
                        <div className="dd-biz-info">📞 1 204-555-0142</div>
                      </div>
                    </div>
                    <AppBottomNav active="home" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 9: CLAIM SUCCESS ── */}
          <div className="step" ref={setStepRef(9)}>
            <div className="ctx">
              <div className="ctx-text">
                <div className="ctx-label">Consumer App</div>
                <h2 className="ctx-h">Offer <span>Claimed!</span></h2>
                <p className="ctx-p">The customer claims the offer and receives a unique QR code. They show this at the register to redeem their 30% discount on Nike shoes.</p>
              </div>
              <div className="ctx-mockup">
                <div className="phone">
                  <PhoneBar />
                  <div className="phone-screen">
                    <div className="claim-screen">
                      <div className="claim-check">✓</div>
                      <h3>Offer Claimed!</h3>
                      <div className="claim-detail">30% Off Nike shoes<br />Save $150.00</div>
                      <div className="qr-box">
                        <svg viewBox="0 0 120 120" width="100" height="100">
                          <rect fill="#1E3A5F" x="0" y="0" width="35" height="35" rx="4" />
                          <rect fill="#fff" x="5" y="5" width="25" height="25" rx="2" />
                          <rect fill="#1E3A5F" x="10" y="10" width="15" height="15" rx="2" />
                          <rect fill="#1E3A5F" x="85" y="0" width="35" height="35" rx="4" />
                          <rect fill="#fff" x="90" y="5" width="25" height="25" rx="2" />
                          <rect fill="#1E3A5F" x="95" y="10" width="15" height="15" rx="2" />
                          <rect fill="#1E3A5F" x="0" y="85" width="35" height="35" rx="4" />
                          <rect fill="#fff" x="5" y="90" width="25" height="25" rx="2" />
                          <rect fill="#1E3A5F" x="10" y="95" width="15" height="15" rx="2" />
                          <rect fill="#1E3A5F" x="42" y="5" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="55" y="5" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="68" y="5" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="42" y="18" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="55" y="18" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="42" y="42" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="57" y="42" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="70" y="42" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="96" y="42" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="5" y="55" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="18" y="55" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="44" y="55" width="30" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="83" y="55" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="42" y="85" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="55" y="85" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="85" y="85" width="8" height="8" rx="1" />
                          <rect fill="#FF6F31" x="98" y="98" width="8" height="8" rx="1" />
                          <rect fill="#1E3A5F" x="109" y="109" width="8" height="8" rx="1" />
                        </svg>
                      </div>
                      <div className="claim-id">CLAIM #PR-2026-4A7F</div>
                      <div className="claim-inst">Show this QR code at the register to redeem your 30% discount. Valid for one use.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── STEP 10: CLOSING ── */}
          <div className="step" ref={setStepRef(10)}>
            <div className="center-content">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/demo/logos/default.png" alt="PopupReach" style={{ width: 180, marginBottom: 16, opacity: .9, display: 'block', margin: '0 auto 16px' }} />
              <h2>Connecting Local Businesses<br />with <span>Nearby Customers</span></h2>
              <div className="closing-stats">
                <div className="cs-item"><div className="num">&lt; 2 min</div><div className="lbl">to create an offer</div></div>
                <div className="cs-item"><div className="num">500m</div><div className="lbl">geofencing radius</div></div>
                <div className="cs-item"><div className="num">Real-time</div><div className="lbl">claim tracking</div></div>
              </div>
              <p>Launch promotions that reach the right people at the right time. Turn foot traffic into loyal customers.</p>
              <button className="closing-cta" onClick={() => window.open('https://popupreach.com', '_blank')}>
                Get Started
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Nav buttons */}
        <button className="nav-btn prev" ref={prevBtnRef} onClick={() => goToStep(curRef.current - 1)} style={{ display: 'none' }}>
          ← Back
        </button>
        <button className="nav-btn next" ref={nextBtnRef} onClick={() => goToStep(curRef.current + 1)} style={{ display: 'none' }}>
          Next →
        </button>
      </div>
    </>
  )
}
