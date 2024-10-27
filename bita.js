chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

	switch (request.type) {
		case 'change_pair':
			changePair(request.pair);
			sendResponse("ok");
			break;
		case 'change_tf':
			changeTimeframe(request.tf, sendResponse);
			break;
		case 'change_value':
			change(request, sendResponse);
			break;
		case 'username':
			usr(sendResponse);
			break;
	}

	return true;
});

async function usr(sendResponse) {
	sessionStorage.setItem('isLoading', true);
	document.dispatchEvent(new CustomEvent('read', {}));

	while (sessionStorage.getItem('isLoading') === 'true') {
		await sleep(50);
	}

	let url = window.location.hostname;
	url = url.replace("www.", '');

	sendResponse({
		username: decodeURIComponent(escape(window.atob(sessionStorage.getItem('g4a')))),
		t: sessionStorage.getItem('g41'),
		urlError: url != 'tradingview.com',
		currentUrl: url
	});
}

function checkForDeepHistory() {
	div = document.querySelectorAll('div[class*="deep-history"]');
	if (div.length > 0) {
		var inputs = div[0].getElementsByTagName('input');
		for (let i = 0; i < inputs.length; i++) {
			const element = inputs[i];
			if (element.type === 'checkbox') {
				return element.checked;
			}
		}
	}
	return false;
}

function openBacktesterTab() {
	let button = document.querySelector('button[aria-label="Open Strategy Tester"]');
	if (button) {
		button.click();
	}
}

function generateReport() {
	div = document.querySelectorAll('div[class*="deep-history"]');
	if (div.length > 0) {
		var btns = div[0].getElementsByTagName('button');
		for (let i = 0; i < btns.length; i++) {
			const btn = btns[i];
			if (btn.innerText === 'Generate report') {
				const res = btn.disabled;
				btn.click();
				return res;
			}
		}
	}
}

async function changeTimeframe(timeframe, sendResponse) {
	let pair = document.querySelectorAll('input[class^="search"]');
	while (pair.length > 0) {
		await sleep(100);
		pair = document.querySelectorAll('input[class^="search"]');
	}

	var script = document.createElement('script');

	script.textContent = '(' + function (tf) {
		var r = document.getElementsByTagName('body');

		var keyNames = new Object();
		keyNames["0"] = "Digit0";
		keyNames["1"] = "Digit1";
		keyNames["2"] = "Digit2";
		keyNames["3"] = "Digit3";
		keyNames["4"] = "Digit4";
		keyNames["5"] = "Digit5";
		keyNames["6"] = "Digit6";
		keyNames["7"] = "Digit7";
		keyNames["8"] = "Digit8";
		keyNames["9"] = "Digit9";
		keyNames["s"] = "KeyS";
		keyNames["m"] = "KeyM";
		keyNames["h"] = "KeyH";
		keyNames["d"] = "KeyD";
		keyNames["w"] = "KeyW";

		tf = tf.toLowerCase();
		for (let i = 0; i < tf.length; i++) {
			var k = tf[i];
			var keyCode = k.charCodeAt(0);
			var eventType = 'keypress';

			var eventDown = new KeyboardEvent(eventType,{
				altKey: false,
				bubbles: true,
				cancelBubble: false,
				cancelable: true,
				charCode: keyCode,// String.fromCharCode(keyCode),
				code: keyNames[k],// String.fromCharCode(keyCode),
				composed: true,
				ctrlKey: false,
				currentTarget: null,
				defaultPrevented: true,
				detail: 0,
				eventPhase: 0,
				isComposing: false,
				isTrusted: true,
				keyCode: keyCode,
				key: k,
				location: 0,
				metaKey: false,
				repeat: false,
				returnValue: false,
				shiftKey: false,
				sourceCapabilities: new InputDeviceCapabilities({firesTouchEvents: false}),
				timeStamp: performance.now(),
				type: eventType,
				view: window,
				which: keyCode
			});

			r[0].dispatchEvent(eventDown);
		}
	} + ')("'+ 2 +'")';

	(document.head||document.documentElement).appendChild(script);
	script.parentNode.removeChild(script);

	await sleep(200);

	var divTf = document.querySelectorAll('div[class^="dialogInner"]');
	var inputTf = divTf[0].getElementsByTagName('input');
	if (inputTf.length > 0) {
		timeframe = timeframe.replace('m', '');

		inputTf[0].value = timeframe;

		inputTf[0].dispatchEvent(new Event("change", { bubbles: true }));
		inputTf[0].dispatchEvent(new Event("blur", { bubbles: true }));

		var script = document.createElement('script');

		script.textContent = '(' + function() {
			var divTf = document.querySelectorAll('div[class^="dialogInner"]');
			var inputTf = divTf[0].getElementsByTagName('form');

			inputTf[0].dispatchEvent(new Event("submit", { bubbles: true }));
		} + ')()';

		(document.head||document.documentElement).appendChild(script);
		script.parentNode.removeChild(script);
	}

	localStorage.setItem('isLoading', true);
	await sleep(200);
	document.dispatchEvent(new CustomEvent('readTrades', {}));

	while (localStorage.getItem('isLoading') === 'true') {
		await sleep(50);
	}

	let res = [];
	const dialogs = document.querySelectorAll("[data-name='indicator-properties-dialog']");
	if (dialogs.length > 0) {
		const inputs = document.querySelectorAll("[inputmode='numeric']");
		for (let i = 0; i < inputs.length; i++) {
			const element = inputs[i];
			res.push({ fieldNo: i + 1, currentValue: element.value });
		}
	}

	sendResponse(res);
}

async function changePair(pair) {
	const symbolBtn = document.getElementById('header-toolbar-symbol-search');
	openBacktesterTab();

	if (checkForDeepHistory()) {
		activatePerformanceSummary();
	}

	if (typeof symbolBtn !== 'undefined') {
		symbolBtn.click();

		await sleep(200);

		const inputField = document.querySelectorAll('input[class^="search"]');
		if (inputField.length > 0) {
			inputField[0].value = pair;

			var script = document.createElement('script');

			script.textContent = '(' + function() {
				const pair = document.querySelectorAll('input[class^="search"]');

				var keyCode = 13;
				var eventType = 'keydown';

				var eventDown = new KeyboardEvent(eventType,{
					altKey: false,
					bubbles: true,
					cancelBubble: false,
					cancelable: true,
					charCode: "Enter",
					code: "Enter",
					composed: true,
					ctrlKey: false,
					currentTarget: null,
					defaultPrevented: true,
					detail: 0,
					eventPhase: 0,
					isComposing: false,
					isTrusted: false,
					key: "Enter",
					keyCode: keyCode,
					location: 0,
					metaKey: false,
					repeat: false,
					returnValue: false,
					shiftKey: false,
					sourceCapabilities: new InputDeviceCapabilities({firesTouchEvents: false}),
					timeStamp: performance.now(),
					type: eventType,
					view: window,
					which: keyCode
				});
				pair[0].dispatchEvent(eventDown);
			} + ')()';

			(document.head||document.documentElement).appendChild(script);
			script.parentNode.removeChild(script);
		}
	}
}

async function change(request, sendResponse) {

	const dialogs = document.querySelectorAll("[data-name='indicator-properties-dialog']");
	if (dialogs.length > 0) {
		const isDeepHistory = checkForDeepHistory();
		let targetNode = document.querySelector('[class^="reportContainer"]');
		if (targetNode == null || isDeepHistory) {
			targetNode = document.querySelector('[class^="backtesting"]');
		}
		let loading = true;
		const config = { attributes: true, childList: true, subtree: true };
		const callback = function(mutationsList, observer) {
			loading = false;
			//console.log('change detected')
		};

		const observer = new MutationObserver(callback);
		observer.observe(targetNode, config);

		const inputs = document.querySelectorAll("[inputmode='numeric']");
		let fieldChanged = false;

		if (inputs.length > 0) {
			for (let i = 0; i < request.fields.length; i++) {

				if (inputs[parseInt(request.fields[i].fieldNo) - 1].value != request.fields[i].currentValue) {
					fieldChanged = true;
				}

				inputs[parseInt(request.fields[i].fieldNo) -1].value = request.fields[i].currentValue;

				inputs[parseInt(request.fields[i].fieldNo) -1].dispatchEvent(new Event("change", { bubbles: true }));
				inputs[parseInt(request.fields[i].fieldNo) - 1].dispatchEvent(new Event("blur", { bubbles: true }));

				var keyCode = 13;
				var eventType = 'keydown';

				var eventDown = new KeyboardEvent(eventType,{
					altKey: false,
					bubbles: true,
					cancelBubble: false,
					cancelable: true,
					charCode: "Enter",
					code: "Enter",
					composed: true,
					ctrlKey: false,
					currentTarget: null,
					defaultPrevented: true,
					detail: 0,
					eventPhase: 0,
					isComposing: false,
					isTrusted: false,
					key: "Enter",
					keyCode: keyCode,
					location: 0,
					metaKey: false,
					repeat: false,
					returnValue: false,
					shiftKey: false,
					sourceCapabilities: new InputDeviceCapabilities({firesTouchEvents: false}),
					timeStamp: performance.now(),
					type: eventType,
					view: window,
					which: keyCode
				});
				inputs[parseInt(request.fields[i].fieldNo) - 1].dispatchEvent(eventDown);
			}

			if (isDeepHistory) {
				await sleep(200);
				const isDisabled = generateReport();
				if (isDisabled) {
					loading = false;
				}
				while (loading && fieldChanged) {
					await sleep(50);
					//console.log("wait");
				}
				await handleDeepHistory(request, sendResponse);
			} else {
				localStorage.setItem('isLoading', true);
				while (loading && fieldChanged) {
					await sleep(50);
					//console.log("wait");
				}
				observer.disconnect();
				await waitForReport();

				document.dispatchEvent(new CustomEvent('readTrades', {}));

				if (request.waitTimespan != null) {
					let waitTimespan = parseInt(request.waitTimespan);
					if (!isNaN(waitTimespan)) {
						await sleep(waitTimespan * 1000);
					}
				}

				while (localStorage.getItem('isLoading') === 'true') {
					await sleep(50);
					//console.log('wait');
				}

				let error = false;
				let errorMsg = '';
				if (localStorage.getItem('error') === 'true') {
					error = true;
					errorMsg = 'No backtest data available. Make sure you have selected your strategy in the "Strategy Tester" tab.';
				}

				const netProfitAll = localStorage.getItem('netProfitAll');
				const percentProfitAll = localStorage.getItem('percentProfitAll');
				const netProfitLong = localStorage.getItem('netProfitLong');
				const percentProfitLong = localStorage.getItem('percentProfitLong');
				const netProfitShort = localStorage.getItem('netProfitShort');
				const percentProfitShort = localStorage.getItem('percentProfitShort');
				const profitFactor = localStorage.getItem('profitFactor');
				const drawDown = localStorage.getItem('drawDown');
				const user = localStorage.getItem("last_username");
				const avgBars = localStorage.getItem("avgBars");
				const totalTrades = localStorage.getItem("totalTrades");
				const sharpRatio = localStorage.getItem("sharpRatio");
				const sortinoRatio = localStorage.getItem("sortinoRatio");

				var s = localStorage.getItem('is_suspicious');
				if (s != null) {
					localStorage.removeItem('is_suspicious');
				}

				sendResponse({
					result: {
						netProfitAll: netProfitAll,
						percentProfitAll: percentProfitAll,
						netProfitLong: netProfitLong,
						percentProfitLong: percentProfitLong,
						netProfitShort: netProfitShort,
						percentProfitShort: percentProfitShort,
						profitFactor: profitFactor,
						drawDown: drawDown,
						avgBars: avgBars,
						totalTrades: totalTrades,
						sharpRatio: sharpRatio,
						sortinoRatio: sortinoRatio,
						user: user
					},
					error: error,
					errorMsg: errorMsg
				});
			}
		}
	}

	sendResponse({
		error: true,
		errorMsg: 'No strategy property window found. Open the input window of your strategy by clicking on the settings button next to your strategy name.'
	});
}

function activatePerformanceSummary() {
	var ps = document.getElementById('Performance Summary');
	if (ps != null) {
		ps.click();
	}
}

function getPercentValue(obj) {
	let percentObj = obj.querySelector('[class*="percentValue"]');
	if (percentObj) {
		let textValue = percentObj.innerText;
		if (textValue != null) {
			textValue = textValue.replace('%', '');
			textValue = textValue.replace('−', '-');
			const v = parseFloat(textValue);
			if (!isNaN(v) && v != 0) {
				return v / 100;
			}
			return v;
		}
	}
	return null;
}

async function waitForReport() {
	let backtestingContainer = document.querySelector('.deep-history');
	if (backtestingContainer) {
		var reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
		while (reportContainer == null) {
			await sleep(100);
			backtestingContainer = document.querySelector('.deep-history');
			reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
			const noData = backtestingContainer.querySelector('[class*="emptyStateIcon"]');
			if (noData) {
				break;
			}
		}
	}
}

async function handleDeepHistory(request, sendResponse) {
	let error = false;
	let errorMsg = '';
	let hasNoData = false;
	let backtestingContainer = document.querySelector('.deep-history');
	if (backtestingContainer) {
		//console.log('Backtesting history found');
		var reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
		while (reportContainer == null) {
			await sleep(100);
			//console.log('wait for report container');
			backtestingContainer = document.querySelector('.deep-history');
			reportContainer = backtestingContainer.querySelector('[class^="reportContainer"]');
			const noData = backtestingContainer.querySelector('[class*="emptyStateIcon"]');
			if (noData) {
				hasNoData = true;
				break;
			}
		}
		//console.log('report container found');
		const reportTable = reportContainer.querySelector('.ka-tbody');
		if (reportTable) {
			//console.log('Report table found');
			let netProfitAll;
			let percentProfitAll;
			let netProfitLong;
			let percentProfitLong;
			let netProfitShort;
			let percentProfitShort;
			let profitFactor;
			let drawDown;
			let avgBars;
			let totalTrades;
			let sharpRatio;
			let sortinoRatio;

			const rows = reportTable.querySelectorAll('.ka-tr');
			if (rows.length > 0) {
				for (let i = 0; i < rows.length; i++) {
					const cells = rows[i].querySelectorAll('.ka-cell');
					let title;
					const titleCell = cells[0].querySelector('[class^="title"]');
					if (titleCell) {
						title = titleCell.innerText;
					}

					//console.log('title', title);

					try {
						switch (title) {
							case 'Net Profit':
								netProfitAll = getPercentValue(cells[1]);
								netProfitLong = getPercentValue(cells[2]);
								netProfitShort = getPercentValue(cells[3]);
								break;
							case "Percent Profitable":
								percentProfitAll = getPercentValue(cells[1]);
								percentProfitLong = getPercentValue(cells[2]);
								percentProfitShort = getPercentValue(cells[3]);
								break;
							case "Max Drawdown":
								drawDown = getPercentValue(cells[1]);
								break;
							case "Avg # Bars in Trades":
								avgBars = cells[1].firstElementChild.innerText;
								if (avgBars) {
									avgBars = parseInt(avgBars);
								}
								break;
							case "Total Closed Trades":
								totalTrades = cells[1].firstElementChild.innerText;
								if (totalTrades) {
									totalTrades = parseInt(totalTrades);
								}
								break;
							case "Profit Factor":
								profitFactor = cells[1].firstElementChild.innerText;
								if (profitFactor) {
									profitFactor = parseFloat(profitFactor);
								}
								break;
							case "Sharpe Ratio":
								sharpRatio = cells[1].firstElementChild.innerText;
								sharpRatio = sharpRatio.replace('−', '-');
								if (sharpRatio) {
									sharpRatio = parseFloat(sharpRatio);
								}
								break;
							case "Sortino Ratio":
								sortinoRatio = cells[1].firstElementChild.innerText;
								sortinoRatio = sortinoRatio.replace('−', '-');
								if (sortinoRatio) {
									sortinoRatio = parseFloat(sortinoRatio);
								}
								break;
						}
					} catch {
						error = true;
						errorMsg = `Error while reading ${title} value.`;
					}
				}

				const user = localStorage.getItem("last_username");

				if (request.waitTimespan != null) {
					let waitTimespan = parseInt(request.waitTimespan);
					if (!isNaN(waitTimespan)) {
						await sleep(waitTimespan * 1000);
					}
				}

				sendResponse({
					result: {
						netProfitAll: netProfitAll,
						percentProfitAll: percentProfitAll,
						netProfitLong: netProfitLong,
						percentProfitLong: percentProfitLong,
						netProfitShort: netProfitShort,
						percentProfitShort: percentProfitShort,
						profitFactor: profitFactor,
						drawDown: drawDown,
						avgBars: avgBars,
						totalTrades: totalTrades,
						sharpRatio: sharpRatio,
						sortinoRatio: sortinoRatio,
						user: user
					},
					error: error,
					errorMsg: errorMsg
				});
			}
			else {
				sendResponse({
					error: true,
					errorMsg: 'Deep backtest performance summary table not found.'
				});
			}
		}

		if (hasNoData) {
			sendResponse({
				result: {
					netProfitAll: 0,
					percentProfitAll: 0,
					netProfitLong: 0,
					percentProfitLong: 0,
					netProfitShort: 0,
					percentProfitShort: 0,
					profitFactor: 0,
					drawDown: 0,
					avgBars: 0,
					totalTrades: 0,
					sharpRatio: 0,
					sortinoRatio: 0,
					user: user
				},
				error: error,
				errorMsg: errorMsg
			});
		}
	}

	sendResponse({
		error: true,
		errorMsg: 'Deep backtesting container not found. Check if the performance summary tab is activated.'
	});
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function resource(filename) {
	let script = document.createElement("script");
	script.src = chrome.extension.getURL(filename);
	script.type = "text/javascript";

	return script;
}

const element = document.body || document.head || document.documentElement;
const manifest = chrome.runtime.getManifest();
const resources = manifest.web_accessible_resources;

for (let i = 0; i < resources.length; i++) {
	let filename = resources[i];
	let script = resource(filename);

	if (!element.querySelector("script[src*='" + filename + "']")) {
		element.appendChild(script);
	}
}