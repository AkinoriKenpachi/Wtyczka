const getElement = (id) => document.getElementById(id);

const updateElementText = (id, text) => {
    const element = getElement(id);
    if (element) element.textContent = text;
};

const getData = async (key) => {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            resolve(result[key]);
        });
    });
};

const formatDate = (date) => {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
};

const resetCookie = async () => {
    try {
        const keysToRemove = ['page', 'list']; // usuń wybrane klucze
		//await Promise.all(keysToRemove.map(key => chrome.storage.local.remove(key)));
        chrome.storage.local.remove(keysToRemove);
        window.location.reload();
        console.log('Storage have been reset.');
    } catch (error) {
        console.error('Error resetting storage:', error);
    }
};

// UI Functions
const createWindow = (form) => {
    const overlay = getElement("overlay");
    overlay.style.display = "flex";
    form.style.display = "flex";
}
const createPopupYeld = () => {
    const form = getElement('yeldForm');
    createWindow(form);
    enableFormDrag('close', form);
    getElement('submitYeldButton').addEventListener('click', handleSubmitYeld);
    getElement('removeYeldButton').addEventListener('click', handleRemoveYeld);
    getElement('closeButton').addEventListener('click', removePopup);
};

const createPopup = () => {
    const form     = getElement('popupFactory');
    createWindow(form);

    getElement("buttonNo").addEventListener('click', removePopup);
    getElement("buttonOk").addEventListener('click', async () => {
        await resetCookie();
        removePopup();
    });
};

const createPopupRaport = () => {
    const form     = getElement('raportForm');
    createWindow(form);
    enableFormDrag('closeRaport', form);
    getElement('closeButtonRaport').addEventListener('click', removePopup);
    getElement('download')?.addEventListener('click', download);
};

// Event Listeners
const handleSubmitYeld = () => submitYeld(true);
const handleRemoveYeld = () => submitYeld(false);

const removePopup = () => {
    const overlay = getElement('overlay');
    overlay.style.display = 'none';

    const formFactory  = getElement("popupFactory");
    const formDay      = getElement("yeldForm");
    const formDownload = getElement("raportForm");

    if(formDownload.style.display !== 'none') {
        formDownload.style.display = 'none';
    }
    if(formFactory.style.display !== 'none') {
        formFactory.style.display = 'none';
    }
    if(formDay.style.display !== 'none') {
        formDay.style.display = 'none';
        submitYeldButton.removeEventListener('click', handleSubmitYeld);
        removeYeldButton.removeEventListener('click', handleRemoveYeld);
    }
    
};

const enableFormDrag = (closeFormId, form) => {
    const closeForm = getElement(closeFormId);
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    closeForm.style.cursor = 'move';
    closeForm.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - form.getBoundingClientRect().left;
        offsetY = e.clientY - form.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    const onMouseMove = (e) => {
        if (isDragging) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const formWidth = form.offsetWidth;
            const formHeight = form.offsetHeight;
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            newLeft = Math.max(0, Math.min(newLeft, viewportWidth - formWidth));
            newTop = Math.max(0, Math.min(newTop, viewportHeight - formHeight));

            form.style.left = `${newLeft}px`;
            form.style.top = `${newTop}px`;
        }
    };

    const onMouseUp = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
};

// Data Manipulation Functions
const submitYeld = async (choice) => {
    const date = formatDate(getElement('date')?.value);
    const info = {
        points: parseFloat(getElement('points')?.value) || 0,
        ok: parseFloat(getElement('ok')?.value) || 0,
        ber: parseFloat(getElement('ber')?.value) || 0
    };
    choice ? await addManualYeld(date, info) : await removeYeldByDate(date);
};

const addManualYeld = async (date, info) => {
    try {
        const data = await chrome.storage.local.get("page");
        let pageData = data.page || {};
        pageData[date] = { date, ...info };
        await chrome.storage.local.set({ page: pageData });
        console.log('Data is updated in the local storage area.');
    } catch (error) {
        console.error('Error adding manual yield:', error);
    }
};

const removeYeldByDate = async (date) => {
    try {
        const pageData = await getData("page") || {};
        const lpnData = await getData("list") || {};
        for (const lpn in lpnData) {
            const lpnObj = lpnData[lpn];
            if (lpnObj.date === date) {
                delete lpnData[lpn];
            }
        }
        delete pageData[date];
        await chrome.storage.local.set({ page: pageData });
        await chrome.storage.local.set({ list: lpnData });

        const existingItem = getElement(date);
        const detailsDate = "details-" + date;
        const existingItemDetails = getElement(detailsDate);

        if (existingItemDetails) {
            getElement("data-list").removeChild(existingItemDetails);
        }

        if (existingItem) {
            getElement("data-list").removeChild(existingItem);
        }

       // console.log(`Date ${date} removed from page object`);
    } catch (error) {
        console.error('Error removing yield by date:', error);
    }
};

const handleAddButtonClick = async () => {
    try {
        const today = new Date();
        const date = today.toISOString().split('T')[0].split('-').reverse().join('-');
        const inputElement = getElement('sendInput');
        const inputVal = parseFloat(inputElement.value) || 0;

        const result = await chrome.storage.local.get("page");
        if (!result.page[date]) {
            result.page[date] = { points: 0, ok: 0, ber: 0 };
        }

        result.page[date].points += inputVal;
        inputElement.value = '';

        await chrome.storage.local.set({ page: result.page });
        console.log('Data is updated in the local storage area.');
    } catch (error) {
        console.error('Error updating points:', error);
    }
};

const handleDniButtonClick = async () => {
    const dni = parseFloat(getElement("DniInput")?.value) || 20;
    await chrome.storage.local.set({ dni });
    getElement("DniInput").value = '';
};

const handleBoosterButtonClick = async () => {
    const rawValue = getElement("BoosterInput")?.value;
    const parsedValue = parseFloat(rawValue);
    const booster = (isNaN(parsedValue) || rawValue === '') ? 3000 : parsedValue;
    await chrome.storage.local.set({ booster });
    getElement("BoosterInput").value = '';
};

const searchLpn = async () => {
    const lpnData = await getData("list") || {};
    const searchInfo = getElement("szukajLPN")?.value;
    const trimmedLpn = searchInfo.replace(/\s+/g, ''); // Usunięcie wszystkich spacji
    const info = getElement("lpnInfo");
    if(Object.keys(lpnData).length !== 0) 
    {
        for (const lpn in lpnData) {
            if (trimmedLpn === lpn) {
                const status = lpnData[lpn].status === "liq" ? "Liquidation" : "Sellable";
                info.textContent = `${lpnData[lpn].date} ${status} ${lpnData[lpn].cena}€ ${lpnData[lpn].points}`;
                return;
            }
            else {
                info.textContent = `brak zamkniętego ${trimmedLpn} w bazie`;
            }
        }
    } else {
        info.textContent = `brak zamkniętych casow w tym miesiacu`;
    }
    
    
};

const removeLpn = async (event) => {
    const lpnData = await getData("list") || {};
    const pageData = await chrome.storage.local.get({ page: {} });
    const fullData = event.target.dataset.lpn;
    const lpnRemove = fullData.split(" - ").shift();

    for (const lpn in lpnData) {
        if (lpnRemove === lpn) {
            const dateData = pageData.page[lpnData[lpnRemove].date];
            if (lpnData[lpnRemove].status === "liq") {
                dateData.ber -= lpnData[lpnRemove].cena;
            } else {
                dateData.ok -= lpnData[lpnRemove].cena;
            }
            dateData.points -= lpnData[lpnRemove].points;
            await chrome.storage.local.set({ page: pageData.page });
            delete lpnData[lpnRemove];
            await chrome.storage.local.set({ list: lpnData });
        }
    }
};

const updateValues = async (sumOK, sumBER, totalPoints, averagePoints) => {
    const old = await chrome.storage.session.get("oldValue");
    let startYield, oldSumOK, oldSumBER, oldTotalPoints, oldAveragePoints;
    if (Object.keys(old).length === 0) {
        startYield = 0;
        oldSumOK = 0;
        oldSumBER = 0;
        oldTotalPoints = 0;
        oldAveragePoints = 0;
    } else {
        startYield = parseFloat(old.oldValue.yeld) || 0;
        oldSumOK = parseFloat(old.oldValue.ok) || 0;
        oldSumBER = parseFloat(old.oldValue.ber) || 0;
        oldTotalPoints = parseFloat(old.oldValue.points) || 0;
        oldAveragePoints = parseFloat(old.oldValue.average) || 0;
    }
    const newYield = ((sumOK / (sumBER + sumOK)) * 100).toFixed(2);
    const total = sumOK + sumBER;

    const barOk = getElement('barOk');
    const barBer = getElement('barBer');
    if (barOk && barBer) {
        barOk.style.width = `${(sumOK / total) * 100}%`;
        barBer.style.width = `${(sumBER / total) * 100}%`;
    }

    const sumOkElement = getElement('sum-ok');
    const sumBerElement = getElement('sum-ber');
    const totalPointsElement = getElement('totalPoints');
    const averageElement = getElement('average');
    const yieldElement = getElement('yield');
    if (sumOkElement) await animateNumberChange(sumOkElement, oldSumOK, sumOK, 1000, '€');
    if (sumBerElement) await animateNumberChange(sumBerElement, oldSumBER, sumBER, 1000, '€');
    if (totalPointsElement) await animateNumberChange(totalPointsElement, oldTotalPoints, totalPoints, 1000);
    if (averageElement) await animateNumberChange(averageElement, oldAveragePoints, averagePoints, 1000);
    if (yieldElement) await animateNumberChange(yieldElement, startYield, parseFloat(newYield), 1000, '%');

    await animateYeldCircle(startYield, parseFloat(newYield), 1000);

    const info = {
        yeld: newYield,
        ok: sumOK,
        ber: sumBER,
        points: totalPoints,
        average: averagePoints
    };

    await chrome.storage.session.set({ oldValue: info });
};

const clearDataList = () => {
    const list = getElement("data-list");
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }
};
async function initializeBooster() {
    const boosterCookie = await getData("booster"); 
    return (boosterCookie !== null && boosterCookie !== undefined) ? boosterCookie : 3000;
}
const displayData = async () => {
    const pageData = await getData("page") || {};
    const lpnData = await getData("list") || {};
    const sortOrder = await getData("sort") || 'asc';
    const sortedDates = sortDates(Object.keys(pageData), sortOrder);
    var toggleDates = [];
    for (const date of sortedDates) {
        if (document.getElementById(`details-${date}`) && document.getElementById(`details-${date}`).classList.contains('open')) {
            toggleDates.push(date);
        }
    }
    let statistics = initializeStatistics();
    clearTable();
    for (const date of sortedDates) {
        const dayData = pageData[date];
        const lpnList = getLpnListForDate(lpnData, date);
		let lengthLpn = lpnList.length;
		
        statistics = await updateStatistics(statistics, dayData);
        
        await updateTableRow(date, dayData, calculateYield(dayData), lpnList, toggleDates,lengthLpn);
    }
    


    const dniTargetCookie = await getData("dni") || 20;
    const boosterCookie = await initializeBooster(); 

    await updateUI(statistics, dniTargetCookie, boosterCookie);
};

const sortDates = (dates, sortOrder) => {
    return dates.sort((a, b) => {
        const dateA = new Date(a.split('-').reverse().join('-'));
        const dateB = new Date(b.split('-').reverse().join('-'));
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
};

const clearTable = () => {
    const tableBody = document.getElementById("data-list");
    tableBody.innerHTML = '';
};

const initializeStatistics = () => {
    return {
        count: 0,
        points: 0,
        ok: 0,
        ber: 0,
    };
};

const getLpnListForDate = (lpnData, date) => {
    const lpnList = [];
    for (const lpn in lpnData) {
        const lpnObj = lpnData[lpn];
        if (lpnObj.date === date) {
            const status = lpnObj.status === "liq" ? "Liquidation" : "Sellable";
            lpnList.push(`${lpn} - <b>${status}</b> ${lpnObj.cena}€ / ${lpnObj.points}`);
        }
    }
    return lpnList;
};

const updateStatistics = (statistics, dayData) => {
    statistics.count += 1;
    statistics.points += dayData.points;
    statistics.ok += dayData.ok;
    statistics.ber += dayData.ber;
    return statistics;
};

const calculateYield = (dayData) => {
    return ((dayData.ok / (dayData.ber + dayData.ok)) * 100).toFixed(2);
};

const updateTableRow = (date, dayData, yieldDay, lpnList, toggleDates,caseCount) => {

	dayData.ok = (dayData.ok).toFixed(2)
	dayData.ber = (dayData.ber).toFixed(2)
    dayData.points = parseFloat(dayData.points.toFixed(3));
    yieldDay = NaNProblem(yieldDay);
    const rowContent = `
        <td>${date}<span class="arrow closed"></span></td>
        <td class="${dayData.points >= 17 ? 'target' : ''}">${dayData.points}</td>
		<td>${caseCount}</td>
        <td>${dayData.ok}</td>
        <td>${dayData.ber}</td>
        <td class="${yieldDay >= 50 ? 'highlight' : ''}">${yieldDay}%</td>
		`;

    const existingRow = document.getElementById(date);
    const existingDetailsRow = document.getElementById(`details-${date}`);
    const wasOpen = existingDetailsRow && existingDetailsRow.classList.contains('open');
    const newRow = document.createElement("tr");
    newRow.innerHTML = rowContent;
    newRow.setAttribute("id", date);        

    const newDetailsRowContent = createDetailsRowContent(lpnList);
    const newDetailsRow = document.createElement("tr");
    newDetailsRow.innerHTML = newDetailsRowContent;
    newDetailsRow.setAttribute("id", `details-${date}`);
    newDetailsRow.classList.add('newDetailsRow');

    const tableBody = document.getElementById("data-list");
    if (existingRow) {
        tableBody.replaceChild(newRow, existingRow);
        
        if (existingDetailsRow) {
            existingDetailsRow.remove();
        }
        if (toggleDates.includes(newRow.id)) {
            toggleRowDetails(newRow, newDetailsRow);
        } 
    } else {
        tableBody.appendChild(newRow);
        newRow.insertAdjacentElement('afterend', newDetailsRow);
        if (toggleDates.includes(newRow.id)) {
            toggleRowDetails(newRow, newDetailsRow);
        } 
    }

    newRow.querySelector('.arrow').classList.toggle('closed', !wasOpen);
    newRow.addEventListener('click', () => toggleRowDetails(newRow, newDetailsRow));
    addRemoveButtonListeners();


};

const createDetailsRowContent = (lpnList) => {
    return `
    <td class="none" colspan="5">
        <div class="content">
            <summary>Closed LPNs</summary>
            <ul>${lpnList.map(lpnData => `
                <li>
                    <span class="lpnSelect"><strong>LPN:</strong> ${lpnData}</span>
                    <span class="removeButton" data-lpn="${lpnData}">×</span>
                </li>`).join('')}
            </ul>
        </div>
    </td>`;
};

const toggleRowDetails = (row, detailsRow) => {
    const arrow = row.querySelector('.arrow');
    arrow.classList.toggle('open');
    detailsRow.classList.toggle('open');
};




const addRemoveButtonListeners = () => {
    const removeButtons = document.getElementsByClassName('removeButton');
    for (let button of removeButtons) {
        button.addEventListener('click', removeLpn);
    }
};

const NaNProblem = (NaNchange) => {
    const parsedValue = parseFloat(NaNchange);
    return isNaN(parsedValue) ? 0 : parsedValue;
};

const updateUI = async (statistics, dni, booster) => {
    const average = NaNProblem(calculateAverage(statistics.points, statistics.count));
    const premia = NaNProblem(calculatePremia(average));
    const yield = NaNProblem(calculateYield(statistics));

    updateElementText("dniwPracy", dni);
    updateElementText("prognozowanyBooster", booster);
    updateElementText("premia", premia);

    updateFinancialData(average, yield, premia, statistics.count);
    updateTargetAndMax(dni, booster, statistics.points, statistics.count, yield);
    updateThresholds(statistics.ok, statistics.ber, yield, dni * 17, dni, booster, statistics.points, statistics.count);

    await updateValues(statistics.ok, statistics.ber, statistics.points, average);
};

const calculateAverage = (points, count) => points / count;
const calculatePremia = (average) => (800 * (average / 17)).toFixed(2);

const updateTargetAndMax = (dni, booster, points, count, yeld) => {
    const target = dni * 17;
    const max = ((booster / calculateBooster(yeld)) + target - points).toFixed(2);
    const aver = (max / (dni - count)).toFixed(2);
    updateElementText("target", target);
    updateElementText("max", max);
    updateElementText("aver", aver);
};

const updateThresholds = (ok, ber, yeld, target, dniTarget, booster, points, count) => {
    const values = [
        { id: "200", factor: 4, cost: 0 },
        { id: "400", factor: 1.436, cost: 3 },
        { id: "600", factor: 0.6666, cost: 4.5 },
        { id: "650", factor: 0.537, cost: 6.5 },
        { id: "700", factor: 0.428, cost: 8 },
        { id: "725", factor: 0.379332, cost: 9.5 },
        { id: "750", factor: 0.331, cost: 11 },
        { id: "775", factor: 0.29, cost: 12.5 },
        { id: "800", factor: 0.25, cost: 14 },
        { id: "825", factor: 0.2121221, cost: 15.5 },
    ];

    values.forEach(({ id, factor, cost }) => {
        const berValue = (Math.round((ok * factor - ber) * 100) / 100).toFixed(3);
        const okValue = (Math.round((ber / factor - ok) * 100) / 100).toFixed(3);
        const avg = ((((booster / cost) + target) - points) / (dniTarget - count)).toFixed(2);
        const element = getElement(`${id}percent`);

        updateElementText(`${id}ber`, berValue < 0 ? "-" : `${berValue} €`);
        updateElementText(`${id}ok`, okValue < 0 ? "-" : `${okValue} €`);
        updateElementText(`${id}avg`, `${avg}`);
        if (element) {
            element.style.background = yeld * 10 >= id ? "#2a792a" : "#971f1f";
        }
    });
};

const updateFinancialData = (average, yeldValue, premia, count) => {
    const boosterValue = calculateBooster(yeldValue);
    let booster = ((average - 17) * boosterValue * count).toFixed(2);
    if (booster < 0) booster = 0;

    const wyplata = 4690 + parseFloat(booster) + parseFloat(premia);
    const brutto = wyplata.toFixed(2);
    const nettop = (wyplata * 0.79).toFixed(2);
    const netto = (wyplata * 0.7345).toFixed(2);

    updateElementText("booster", NaNProblem(booster));
    updateElementText("brutto", NaNProblem(brutto));
    updateElementText("nettop", NaNProblem(nettop));
    updateElementText("netto", NaNProblem(netto));
};

const calculateBooster = (yeld) => {
    const ranges = [
        { min: 82.5, max: Infinity, value: 15.50 },
        { min: 80, max: 82.49, value: 14 },
        { min: 77.5, max: 79.9, value: 12.5 },
        { min: 75, max: 77.49, value: 11 },
        { min: 72.5, max: 74.9, value: 9.5 },
        { min: 70, max: 72.49, value: 8 },
        { min: 65, max: 69.9, value: 6.5 },
        { min: 60, max: 64.9, value: 4.5 },
        { min: -Infinity, max: 59.9, value: 3 },
    ];

    return ranges.find(range => yeld > range.min && yeld <= range.max)?.value || 0;
};

const toggleSortOrder = async () => {
    let currentSortOrder = await getData("sort") || 'asc';
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    await chrome.storage.local.set({ sort: currentSortOrder });
    updateSortButtonClass(currentSortOrder);
    return currentSortOrder;
};
const updateSortButtonClass = (sortOrder) => {
    const button = getElement('toggleSortButton');
    button.classList.remove('asc', 'desc');
    button.classList.add(sortOrder);
};
const initializeSortButton = async () => {
    const currentSortOrder = await getData("sort") || 'asc';
    updateSortButtonClass(currentSortOrder);
};
// Animation Functions
const getGradientColor = (yieldValue) => {
    const greenEnd = { r: 42, g: 121, b: 42 }; // #2a792a
    const redStart = { r: 151, g: 31, b: 31 }; // #971f1f

    const interpolate = (start, end, factor) => {
        return start + (end - start) * factor;
    };

    const r = Math.round(interpolate(redStart.r, greenEnd.r, yieldValue / 100));
    const g = Math.round(interpolate(redStart.g, greenEnd.g, yieldValue / 100));
    const b = Math.round(interpolate(redStart.b, greenEnd.b, yieldValue / 100));

    return `rgb(${r}, ${g}, ${b})`;
};

// Function to smoothly update the pie chart using requestAnimationFrame
const animateYeldCircle = (startYield, endYield, duration) => {
    const startTime = performance.now();

    const update = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentYield = NaNProblem(startYield + (endYield - startYield) * progress);
        const color = getGradientColor(currentYield);
        document.getElementById('yeldCircle').style.background = 
        `conic-gradient(${color} 0%, ${color} ${currentYield}%, rgba(143, 143, 143, 0.5) ${currentYield}%, rgba(143, 143, 143, 0) 100%)`;
        document.getElementById('yeldCenterText').textContent = currentYield.toFixed(2) + '%';
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };

    requestAnimationFrame(update);
};

// Function to animate number changes
const animateNumberChange = async (element, startValue, endValue, duration, unit = '') => {
    const startTime = performance.now();
    const updateNumber = async (timestamp) => {
        const elapsed = timestamp - startTime;
        let progress = Math.min(elapsed / duration, 1);
        const step = 0.3; // Możesz dostosować tę wartość
        progress = Math.min(progress + step, 1);


        // Zwiększenie częstotliwości aktualizacji liczby
        const updateInterval = 25; // czas w milisekundach

        if (elapsed % updateInterval < 16.67) { // 16.67 ms = 1 frame przy 60 fps
            const currentValue = startValue + (endValue - startValue) * progress;
            element.textContent = currentValue.toFixed(3) + unit;
        }
        
        if (progress < 1) {
            await requestAnimationFrame(updateNumber);
        }
    };
    await requestAnimationFrame(updateNumber);
};


// Funkcja do ustawienia flagi w chrome.storage.local
const setDisplayDataCalled = (value) => {
    return new Promise((resolve) => {
        chrome.storage.session.set({ displayDataCalled: value }, () => {
            console.log('Display data flag set to', value);
            resolve();
        });
    });
};

// Funkcja do pobrania flagi z chrome.storage.local
const getDisplayDataCalled = () => {
    return new Promise((resolve) => {
        chrome.storage.session.get(['displayDataCalled'], (result) => {
            resolve(result.displayDataCalled);
        });
    });
};

// Funkcja do resetowania flagi w chrome.storage.local
const resetDisplayDataFlag = () => {
    return setDisplayDataCalled(false);
};

// Nasłuchiwanie zmian w chrome.storage.local
chrome.storage.local.onChanged.addListener(async (changes) => {
    const keysToCheck = new Set(['page', 'dni', 'booster', 'list']);
    let shouldDisplayData = false;

    for (const key in changes) {
        if (keysToCheck.has(key)) {
            shouldDisplayData = true;
            break; // If any key matches, we can break the loop early
        }
    }

    if (shouldDisplayData) {
        const displayDataCalled = await getDisplayDataCalled();
        if (!displayDataCalled) {
            await displayData();

            await setDisplayDataCalled(true);
            console.log("Display data updated");

            // Reset the flag after handling the changes
            await resetDisplayDataFlag();
        }
    }
});
const download = async () => {
    
    let check = {
        lpn    : document.getElementById('lpn').checked,
        casePl : document.getElementById('casePl').checked,
        asin   : document.getElementById('asin').checked,
        price  : document.getElementById('price').checked,
        points : document.getElementById('point').checked,
        paleta : document.getElementById('paleta').checked
    }
    console.log("check test:",check);
    await fetchAndSaveDataAsCsv(check);
    removePopup();
}
const getList = async (lpnData, date,check) => {
    const lpnList = [];
    for (const lpn in lpnData) {
        const lpnObj = lpnData[lpn];
        if (lpnObj.date === date) {
            const status = lpnObj.status === "liq" ? "Liquidation" : "Sellable";
            let raport = "";
            if(check.lpn) raport += `${lpn}-`;
            if(check.casePl) raport += `${lpnObj.case}-`;
            if(check.asin) raport += `${lpnObj.asin}-`;
            if(check.price) raport += `${lpnObj.cena}-`;
            if(check.points) raport += `${lpnObj.points}-`;
            if(check.paleta) raport += `${status}-`;
            raport = raport.slice(0, -1);
            lpnList.push(`${raport}`);
        }
    }
    return lpnList;
};
const fetchAndSaveDataAsCsv = async (check) => {
    // Fetch data from various sources
    const pageData = await getData("page") || {};
    const lpnData = await getData("list") || {};
    const sortOrder = await getData("sort") || 'asc';

    // Sort the dates from the pageData based on the provided sort order
    const sortedDates = sortDates(Object.keys(pageData), sortOrder);

    // Initialize raw data array
    const rawData = [];

    // Iterate over each date
    for (const date of sortedDates) {
        // Retrieve the list of LPNs for the current date
		
        const lpnList = await getList(lpnData, date, check);

        // Add each LPN under the date with its status

        lpnList.forEach((lpn, index) => {
            console.log("datatest:", lpn, "fulldata:", lpnList);

            let parts = lpn.split('-');
            let lpnIndex = 0;

            let entry = {
                DATA: index === 0 ? date : '', // Only show the date for the first entry
            };

            if (check.lpn) entry.LPN = parts[lpnIndex++];
            if (check.casePl) entry.CASE = parts[lpnIndex++];
            if (check.asin) entry.ASIN = parts[lpnIndex++];
            if (check.price) entry.PRICE = parts[lpnIndex++];
            if (check.points) entry.POINTS = parts[lpnIndex++];
            if (check.paleta) entry.STATUS = parts[lpnIndex++];

            rawData.push(entry);
        });
    }

    // Convert the data model to CSV format
    const csvData = convertToCSV(rawData);

    // Save the constructed CSV data
    await saveDataAsCsv(csvData);
};

// Function to convert JSON data to CSV format
const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        return 'brak zapisanych danych';
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    return `${headers}\n${rows}`;
};


function saveDataAsCsv(data) {
    return new Promise((resolve) => {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Raport.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a); // Clean up the DOM
        resolve();
    });
}
document.addEventListener('DOMContentLoaded', () => {
    displayData();
    initializeSortButton();
    getElement('addButton')?.addEventListener('click', handleAddButtonClick);
    getElement('reset-btn')?.addEventListener('click', createPopup);
    getElement('yeldButton')?.addEventListener('click', createPopupYeld);
    getElement('dniButton')?.addEventListener('click', handleDniButtonClick);
    getElement('boosterButton')?.addEventListener('click', handleBoosterButtonClick);
    getElement('lpnButton')?.addEventListener('click', searchLpn);
    getElement('raport')?.addEventListener('click', createPopupRaport);
	
    getElement('toggleSortButton').addEventListener('click', async () => {
        try {
            await toggleSortOrder();
            await displayData(); // Dodanie wyświetlania danych po zmianie sortowania
        } catch (error) {
            console.error("Błąd podczas zmiany kolejności sortowania:", error);
        }
    });
});
document.querySelector('.container').addEventListener('click', function(event) {
    const isClickInsideMenu = document.querySelector('.menu').contains(event.target);
    const isClickOnToggler = event.target.matches('.toggler');
	const sidebar = document.getElementById('sidebar');
    if (!isClickInsideMenu && !isClickOnToggler) {
        document.querySelector('.toggler').checked = false;
		  if (sidebar.classList.contains('visible')) {
			sidebar.classList.remove('visible');
		  }
    }
});


document.addEventListener("DOMContentLoaded", function() {
    const loadingScreen = document.getElementById('loading-screen');
    const load = document.getElementById('load');
    const leftDoor = document.querySelector('.left-door');
    const rightDoor = document.querySelector('.right-door');

    // Simulate a loading process (e.g., fetching data, loading images, etc.)
    setTimeout(function() {
        // Start fading out the load element
        load.style.opacity = '0';
        
        // Wait for a short time before opening the doors
        setTimeout(function() {
            leftDoor.style.transform = 'translateX(-100%)';
            rightDoor.style.transform = 'translateX(100%)';
            
            // Wait for the door animation to complete before hiding the loading screen
            setTimeout(function() {
                loadingScreen.style.display = 'none';
            }, 800); // Adjust this to match the door transition duration
            
        }, 400); // Adjust this delay to control how long before the doors open after fading out the load element
        
    }, 1100); // Adjust the timeout as needed to simulate loading time
});



const fileInputErsa = document.getElementById("imageFileErsa");
const bgErsa = document.getElementById("bgErsa");

// Set up the event listener for the custom button
bgErsa.addEventListener("click", () => {
    fileInputErsa.click();
});

// Set up the event listener for the file input
fileInputErsa.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result.split(',')[1];
            chrome.storage.local.set({ backgroundBlobErsa: base64String }, () => {
                // Update the background immediately after setting the new image
                // Change the button text to indicate the file has been uploaded
                bgErsa.textContent = "Zmieniono tapete";
                setTimeout(() => {
                    bgErsa.textContent = "Wgraj tapete Ersa";
                }, 2000);
            });
        };
        reader.readAsDataURL(file);
    }
});



// Get references to the elements
const fileInputYeld = document.getElementById("imageFileYeld");
const bgYeld = document.getElementById("bgYeld");

// Set up the event listener for the custom button
bgYeld.addEventListener("click", () => {
    fileInputYeld.click();
});

// Set up the event listener for the file input
fileInputYeld.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result.split(',')[1];
            chrome.storage.local.set({ backgroundBlobYeld: base64String }, () => {
                // Update the background immediately after setting the new image
                updateBackground(base64String);
                // Change the button text to indicate the file has been uploaded
                bgYeld.textContent = "Zmieniono tapete";
                setTimeout(() => {
                    bgYeld.textContent = "Wgraj tapete Yeld";
                }, 2000);
            });
        };
        reader.readAsDataURL(file);
    }
});

const bg = getElement("backgroundWallpaper");

function updateBackground(base64String) {
    // Create a new image element
    const img = new Image();
    img.src = `data:image/png;base64,${base64String}`;
    
    // Wait for the image to load
    img.onload = () => {
        // Apply the background image once it's fully loaded
        bg.style.backgroundImage = `url('data:image/png;base64,${base64String}')`;
        
        // Force a re-render by momentarily changing the display property
        bg.style.display = 'none';
        setTimeout(() => {
            bg.style.display = '';
        }, 0);
    };

    img.onerror = () => {
        console.error("Failed to load image");
    };
}

// Load the initial background from storage when the page loads
chrome.storage.local.get('backgroundBlobYeld', (data) => {
    const base64String = data.backgroundBlobYeld;
    if (base64String) {
        updateBackground(base64String);
    }
});