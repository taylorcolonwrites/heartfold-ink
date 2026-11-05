'use client';
import {useEffect} from 'react';
export default function Storefront(){useEffect(()=>{const script=document.createElement('script');script.src='/app.js';script.async=true;document.body.appendChild(script);return()=>{script.remove();}},[]);return <><div id="app"><p style={{padding:30}}>Loading Heartfold Ink…</p></div><noscript>Heartfold Ink uses JavaScript for the shop and order forms. Please enable JavaScript to continue.</noscript></>}
