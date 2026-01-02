// 啦啦啦 由 GitHub Copilot 產生
// 此檔案提供一個簡單的 a+b 函式，接受兩個數字並回傳其和（輸入不為數字時會拋出錯誤）

function addNumbers(A, B) {
	// 驗證輸入型態
	if (typeof A !== 'number' || typeof B !== 'number') {
		throw new TypeError('參數必須為數字');
	}
	return A + B;
}

// 匯出函式供其他模組使用
module.exports = {
	addNumbers,
};

// 當直接以 node 執行此檔案時，做一個簡單的自我測試
if (require.main === module) {
	try {
		const RESULT = addNumbers(2, 3);
		console.log('RESULT', RESULT);
	} catch (err) {
		console.error('ERROR', err && err.message);
		process.exit(1);
	}
}

