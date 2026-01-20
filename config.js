// Clover Coin conversion API base. Set this to your backend origin when available.
// Example: window.CLAIM_API_BASE = 'https://api.tradehax.net';
 (function(){
	 try {
		 var params = new URLSearchParams(window.location.search || '');
		 var fromQuery = params.get('claim_api_base');
		 var fromLocal = null;
		 try { fromLocal = localStorage.getItem('CLAIM_API_BASE'); } catch (e) {}
		 var defaultBase = '';
		 var base = (fromQuery || fromLocal || defaultBase || '').replace(/\/+$/, '');
 
		 window.CLAIM_API_BASE = base || null;
		 window.CLAIM_API_DOC = {
			 endpoints: { challenge: '/claim/challenge', submit: '/claim/submit' }
		 };
 
		 window.setClaimApiBase = function(url){
			 var clean = (url || '').replace(/\/+$/, '');
			 window.CLAIM_API_BASE = clean || null;
			 try {
				 if (clean) localStorage.setItem('CLAIM_API_BASE', clean);
				 else localStorage.removeItem('CLAIM_API_BASE');
			 } catch (e) {}
			 return window.CLAIM_API_BASE;
		 };
 
		 if (fromQuery) {
			 try { localStorage.setItem('CLAIM_API_BASE', base); } catch (e) {}
		 }
	 } catch (e) {
		 console.warn('CLAIM_API_BASE config error:', e);
	 }
 })();
