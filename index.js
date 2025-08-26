document.addEventListener('DOMContentLoaded', function () {
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const result = document.getElementById('result');
    const status = document.getElementById('status');
    const totalWordsEl = document.getElementById('totalWords');
    const convertedWordsEl = document.getElementById('convertedWords');
    const englishWordsEl = document.getElementById('englishWords');

    // نقشه کاراکترهای انگلیسی به فارسی
    const englishToFarsiMap = {
        'q': 'ض', 'w': 'ص', 'e': 'ث', 'r': 'ق', 't': 'ف', 'y': 'غ', 'u': 'ع', 'i': 'ه', 'o': 'خ', 'p': 'ح',
        '[': 'ج', ']': 'چ', 'a': 'ش', 's': 'س', 'd': 'ی', 'f': 'ب', 'g': 'ل', 'h': 'ا', 'j': 'ت', 'k': 'ن',
        'l': 'م', ';': 'ک', "'": 'گ', 'z': 'ظ', 'x': 'ط', 'c': 'ز', 'v': 'ر', 'b': 'ذ', 'n': 'د', 'm': 'پ',
        ',': 'و', '?': '؟'
    };

    // کش برای ذخیره کلمات تأیید شده
    const verifiedEnglishWords = new Set();
    const nonEnglishWords = new Set();

    // لیستی از کلمات رایج انگلیسی
    const commonEnglishWords = new Set([
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
        'and', 'or', 'but', 'not', 'on', 'in', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'of', 'off', 'over', 'under',
        'hello', 'world', 'google', 'facebook', 'youtube', 'twitter', 'instagram', 'whatsapp', 'computer', 'internet', 'network',
        'program', 'software', 'application', 'system', 'database', 'technology', 'information', 'communication', 'developer'
    ]);

    // الگوهای رایج برای تشخیص لینک‌ها و دامنه‌ها
    const urlPattern = /^(https?:\/\/|www\.|ftp:\/\/|mailto:)[^\s]+$/i;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // کلمات و عبارات رایج فارسی که با کیبورد انگلیسی تایپ می‌شوند
    const commonFarsiPatterns = new Set([
        'sghl', 'khobi', 'chetori', 'merci', 'motshakker', 'mamnoon', 'chetory', 'khosh',
        'salam', 'sohbat', 'shoma', 'hale', 'halam', 'khoob', 'khoobi', 'khoobam', 'dorood',
        'halet', 'hal', 'halesh', 'cheshmat', 'cheshmet', 'cheshmam', 'cheshman'
    ]);

    // بررسی وجود کلمه در دیکشنری با استفاده از API
    async function checkWithDictionaryAPI(word) {
        if (!word || word.length < 2) return false;

        const lowerWord = word.toLowerCase();

        // اگر قبلاً تأیید شده، نیازی به بررسی مجدد نیست
        if (verifiedEnglishWords.has(lowerWord)) return true;
        if (nonEnglishWords.has(lowerWord)) return false;

        // بررسی کلمات رایج
        if (commonEnglishWords.has(lowerWord)) {
            verifiedEnglishWords.add(lowerWord);
            return true;
        }

        // بررسی الگوهای خاص
        if (urlPattern.test(word) || emailPattern.test(word) || domainPattern.test(word)) {
            verifiedEnglishWords.add(lowerWord);
            return true;
        }

        // بررسی الگوهای رایج فارسی
        if (commonFarsiPatterns.has(lowerWord)) {
            nonEnglishWords.add(lowerWord);
            return false;
        }

        // بررسی ساختار کلمه (حاوی اعداد یا کاراکترهای خاص نباشد)
        if (/[0-9@#$%^&*()_+={}\[\]|\\:;"'<>,?/~`]/.test(word)) {
            nonEnglishWords.add(lowerWord);
            return false;
        }

        try {
            showStatus('در حال بررسی کلمه: ' + word, 'loading');

            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lowerWord)}`);

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0 && data[0].word) {
                    verifiedEnglishWords.add(lowerWord);
                    showStatus('کلمه "' + word + '" در دیکشنری یافت شد و تبدیل نشد', 'success');
                    return true;
                }
            } else if (response.status === 404) {
                // کلمه در دیکشنری پیدا نشد
                nonEnglishWords.add(lowerWord);
                showStatus('کلمه "' + word + '" در دیکشنری یافت نشد', 'error');
                return false;
            }
        } catch (error) {
            console.log('خطا در بررسی کلمه:', error);
            showStatus('خطا در اتصال به دیکشنری', 'error');
            // در صورت خطا، از روش اکتشافی استفاده می‌کنیم
            return checkWithHeuristic(word);
        }

        return false;
    }

    // روش اکتشافی برای زمانی که API در دسترس نیست
    function checkWithHeuristic(word) {
        if (!word || word.length < 2) return false;

        // بررسی نسبت حروف صدادار به بیصدا
        const vowels = word.match(/[aeiouAEIOU]/g);
        const consonants = word.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g);

        if (!vowels || !consonants) return false;

        // کلمات انگلیسی معمولاً دارای نسبت معینی از حروف صدادار هستند
        const vowelRatio = vowels.length / word.length;
        return vowelRatio > 0.2 && vowelRatio < 0.6;
    }

    // تبدیل متن انگلیسی به فارسی در صورت نیاز
    async function convertIfNeeded(text) {
        if (!text || text.trim().length === 0) return text;

        // اگر متن کاملاً انگلیسی معتبر باشد، تبدیل نشود
        const isEnglish = await checkWithDictionaryAPI(text);
        if (isEnglish) {
            return text;
        }

        // بررسی آیا متن احتمالاً فارسی تایپ شده با کیبورد انگلیسی است
        let shouldConvert = false;
        let convertedText = '';

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (englishToFarsiMap[char]) {
                shouldConvert = true;
                convertedText += englishToFarsiMap[char];
            } else {
                convertedText += char;
            }
        }

        return shouldConvert ? convertedText : text;
    }

    // نمایش وضعیت
    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;

        if (type === 'loading') {
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            status.innerHTML = '';
            status.appendChild(spinner);
            status.appendChild(document.createTextNode(' ' + message));
        }

        // پاک کردن وضعیت پس از 3 ثانیه
        setTimeout(() => {
            status.style.opacity = '0';
            setTimeout(() => {
                status.className = 'status';
                status.style.opacity = '1';
            }, 1000);
        }, 3000);
    }

    // تبدیل متن
    async function convertText() {
        const text = inputText.value;
        if (!text) {
            showStatus('لطفاً متنی برای تبدیل وارد کنید', 'error');
            return;
        }

        showStatus('در حال پردازش متن...', 'loading');

        try {
            const words = text.split(/(\s+)/);
            let convertedWords = [];
            let convertedCount = 0;
            let englishCount = 0;

            for (const word of words) {
                if (word.trim() === '') {
                    convertedWords.push(word);
                    continue;
                }

                const convertedWord = await convertIfNeeded(word);

                if (word !== convertedWord) {
                    convertedCount++;
                } else if (verifiedEnglishWords.has(word.toLowerCase())) {
                    englishCount++;
                }

                convertedWords.push(convertedWord);
            }

            // نمایش نتیجه
            result.innerHTML = convertedWords.join('');

            // نمایش اطلاعات در مورد تبدیل
            let conversionInfo = '';
            for (let i = 0; i < words.length; i++) {
                const w = words[i].trim();
                if (!w) continue;

                if (words[i] !== convertedWords[i]) {
                    conversionInfo += `<div class="word-check">"${words[i]}" → <span class="converted-word">${convertedWords[i]}</span></div>`;
                } else if (verifiedEnglishWords.has(w.toLowerCase())) {
                    conversionInfo += `<div class="word-check">"${words[i]}" → <span class="english-word">(کلمه انگلیسی معتبر - بدون تغییر)</span></div>`;
                }
            }

            if (conversionInfo) {
                result.innerHTML += '<div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">' + conversionInfo + '</div>';
            }

            // به روز رسانی آمار
            totalWordsEl.textContent = words.filter(w => w.trim()).length;
            convertedWordsEl.textContent = convertedCount;
            englishWordsEl.textContent = englishCount;

        } catch (error) {
            console.error('خطا در تبدیل متن:', error);
            showStatus('خطا در پردازش متن', 'error');
        }
    }

    // پاک کردن متن
    function clearText() {
        inputText.value = '';
        result.textContent = '';
        status.className = 'status';
        totalWordsEl.textContent = '0';
        convertedWordsEl.textContent = '0';
        englishWordsEl.textContent = '0';
    }

    // رویدادهای دکمه‌ها
    convertBtn.addEventListener('click', convertText);
    clearBtn.addEventListener('click', clearText);

    // تبدیل خودکار هنگام تایپ
    let typingTimer;
    const typingDelay = 1000; // 1 ثانیه تأخیر پس از تایپ

    inputText.addEventListener('input', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(convertText, typingDelay);
    });

    // متوقف کردن تایمر هنگام پاک کردن
    inputText.addEventListener('keydown', function () {
        clearTimeout(typingTimer);
    });

    // پر کردن textarea با مثال
    inputText.value = "sghl?";
    convertText();
});