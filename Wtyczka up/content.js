chrome.storage.sync.get(
{
    function8Enabled: true,
}, (options) =>
{
    if (options.function8Enabled)
    {
        window.update = warjacjaNaTematWygladu()
    }
});
/*
chrome.storage.local.remove(['queue'], function() {
  console.log('Queue removed from storage');
});
chrome.storage.local.remove('sn', function() {
  console.log('Queue removed from storage');
});
*/

$(document).ready(function() {
    if (window.location.href.includes('https://ersa.emea.intra.acer.com/')) {

        // Create a div for the background
        document.body.appendChild(Object.assign(document.createElement("div"), { id: "bag" }));

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("Message received in content script:", message);

            if (message.type === 'processCase') {
                console.log("Content script received case:", message.caseData);
                const array = message.caseData.split(",");
                
                processCaseInIframe(array).then(resultText => {
                    console.log("Sending response back to background script:", resultText);
                    document.querySelector(".badge.badgeown .panel-body .row").innerHTML += `<p>${resultText}</p>`;
                    sendResponse({ result: resultText });
                }).catch(error => {
                    console.error("Error processing Case:", error);
                    sendResponse({ error: error.message });
                });

                return true;
            }

            return true;
        });

        function processCaseInIframe(data) {
            return new Promise((resolve, reject) => {
                console.log("TEST PROMISE");
                const iframe = document.createElement('iframe');
                iframe.src = 'https://ersa.emea.intra.acer.com/PLRC/SAWelcome.aspx';
                Object.assign(iframe.style, {
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: '0',
                    left: '0',
                    zIndex: '1000'
                });
                iframe.id = "frame";
                document.body.appendChild(iframe);

                const waitForPageLoad = () => new Promise(resolve => {
                    iframe.onload = () => resolve(iframe.contentDocument || iframe.contentWindow.document);
                });

                const chainActions = async (iframeDocument) => {
                    iframeDocument.location.href = `https://ersa.emea.intra.acer.com/PLRC/SAMain.aspx?QuickSearch=${data[0]}`;

                    iframeDocument = await waitForPageLoad();
                    await autoEditClick(true, iframeDocument);

                    iframeDocument = await waitForPageLoad();
                    await autoPickUp(true, iframeDocument);

                    iframeDocument = await waitForPageLoad();
                    await autoCloseCase(true, iframeDocument, data[1]);

                    const checkResult = async () => {
                        if (!iframeDocument.getElementById("refresh")) {
                            createRequiredButtons(iframeDocument);
                        }
                        const resultElement = iframeDocument.getElementById("Maincontent_TBoCSSStatus");
                        if (resultElement?.value !== "Repair Complete") {
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            return checkResult();
                        } else {
                            await yeldFunction(iframeDocument);
                            resolve(iframeDocument.getElementById("TBoCSSSerial")?.value + " : " + resultElement.value);
                            document.body.removeChild(iframe);
                        }
                    };

                    checkResult().catch(error => reject(error));
                };

                iframe.onload = () => {
                    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                    chainActions(iframeDocument).catch(error => reject(error));
                };
            });
        }
    }
});



        /*

        funkcja do kolejkowania ze strony
        async function addEnqueue(value)
        {
            chrome.runtime.sendMessage(
            {
                type: 'enqueue',
                h3: value
            });
        }
        */

/*
        // Create a new style sheet
        const styleSheet = document.createElement('style');
        document.head.appendChild(styleSheet);
        const css = styleSheet.sheet;
        // Add rules to the style sheet
        css.insertRule(`
    body {
        font-family: Arial, sans-serif;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
        padding: 0;
    }
	`);
        css.insertRule(`
	p {
		    margin:0;
		}
`);
        css.insertRule(`
	label {
		display: inline-block;
		margin-bottom: 0px;
		font-weight: bold;
		margin-right: 4px;
		}
`);
        css.insertRule(`
    button {
        display:none;
    }
`);
*/


$(document).ready(function() {
    if (window.location.href.indexOf('https://www.amazon.de/recommerce/evaluation/grading') > -1) {
        var listOfOptions = ['Adapter (e.g. USB-C to USB-A)', 'Assembly Hardware - Screws/Fasteners', 'Assembly Tools - Wrenches/screw drivers', 'Auxiliary battery', 'AV cable', 'Bag / Filter', 'Non-rechargeable battery', 'Battery charger',
            'Base / Charging station', 'Belt clip', 'Bonus code / Voucher', 'Case', 'Coffee Pod(s) / Pouch', 'Cleaning solution', 'Earphones', 'Ethernet cable', 'Hose/ Vacuum Attachment', 'HDMI cable', 'Ink cartridge / toner', 'Lens hood/ cap',
            'Manual', 'Memory card', 'Paper roll for printers', 'Plates/pans', 'Power Adapter', 'Power cord', 'SATA cable', 'Screen foil', 'Software CD', 'Strap', 'USB/ Firewire cable', 'Wall bracket', 'Water tank',
            'Ear pad (over-ear type)', 'Ear tip (In-ear type)'];

        var $floatingBox = $('<table/>', {
            id: 'accCheckBox',
            css: {
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '250px',
                backgroundColor: 'white',
                overflow: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
				display: 'none'
            }
        }).append('<style>::-webkit-scrollbar { display: none; }</style>');

        var checkboxStates = JSON.parse(localStorage.getItem('checkboxStates')) || {};
        var checkboxOrder = JSON.parse(localStorage.getItem('checkboxOrder')) || listOfOptions;

        checkboxOrder.forEach(function(option) {
            var $checkbox = $('<input/>', {
                type: 'checkbox',
                id: option,
                value: option,
                checked: checkboxStates[option]
            });
            var $label = $('<label/>', {
                'for': option,
                text: option
            });
            var $row = $('<tr/>', {
                draggable: 'true'
            }).append($('<td/>').append($checkbox, $label));
            $floatingBox.append($row);
        });

        $('body').append($floatingBox);

        $floatingBox.on('change', 'input[type="checkbox"]', function() {
            checkboxStates[this.id] = this.checked;
            localStorage.setItem('checkboxStates', JSON.stringify(checkboxStates));
        });

        var draggedElem = null;

        $floatingBox.on('dragstart', 'tr', function(e) {
            draggedElem = this;
        });

        $floatingBox.on('dragover', 'tr', function(e) {
            e.preventDefault();
        });

        $floatingBox.on('drop', 'tr', function(e) {
            e.preventDefault();
            $(draggedElem).remove();
            $(this).before(draggedElem);
            checkboxOrder = $floatingBox.find('tr').map(function() {
                return this.firstChild.firstChild.id;
            }).get();
            localStorage.setItem('checkboxOrder', JSON.stringify(checkboxOrder));
        });
		var css = `
            <style>
                #accCheckBox {
                    font-family: Arial, sans-serif;
                    font-size: 9px;
                    color: #333;
                    height: 200px; /* Set a fixed height */
                    overflow-y: auto; /* Enable vertical scrolling */
                }
                #accCheckBox tr {
                    border-bottom: 1px solid #ddd;
                    cursor: move;
                }
                #accCheckBox tr:hover {
                    background-color: #f6f6f6;
                }
            </style>
        `;


        $('head').append(css);
    }
});







$(document).ready(function()
{
    if (window.location.href.indexOf('https://www.amazon.de/recommerce/evaluation/grading') > -1) 
	{
		function createButton(text, id, color, bottom, left, commands, target) 
		{
			var btn = $('<button/>', 
			{
				text: text,
				id: id,
				style: 'position:fixed;bottom:' + bottom + 'px;right:' + left + 'px;color:' + color + ';z-index:9999;',
				click: function() 
				{
					var i = 0;
					function executeCommand() 
					{
						if (i >= commands.length) return;
						commands[i++]();
						setTimeout(executeCommand, 100);
					}
					executeCommand();
				}
			});
		$('body').append(btn);
		}	
	

        var berCommands =
        [
            function() { return $("#verify-question-success").click(); },
            function() { return $('h4:contains("Does the item present an immediate safety risk?")').parent().parent().find('button:contains("No")').click(); },
            function() { return $("#continue-grading-btn-id").click(); },
            function() { return $('h4:contains("Read the Customer Comment. How would you best describe what the customer said?")').parent().parent().find('button:contains("Product has a problem or defect")').click(); },
            function() { return $('h4:contains("Test the item. Does the defect exist?")').parent().parent().find('button:contains("Yes - Does not function properly")').click(); },
            function() 
			{
                var lpnLabel = $('#lpn-label');
                if (lpnLabel.text().trim().startsWith('LPN')) 
				{
                    var tempInput = $("<input>");
                    $("body").append(tempInput);
                    tempInput.val(lpnLabel.text()).select();
                    document.execCommand("copy");
                    tempInput.remove();
                    console.log('Copied to clipboard: ' + lpnLabel.text());
                }
            }
        ];
        createButton('BER', 'myFloatingButton', 'red', 10, 100, berCommands);
	}
});



$(document).ready(function() {
    if (window.location.href.indexOf('https://www.amazon.de/recommerce/evaluation/grading') > -1) {
        var box = $('<div/>', {
            id: 'switchBoxes',
            style: 'position:fixed;bottom:20px;right:20px;padding:10px;background-color:#f0f0f0;border:1px solid #ccc;display:none;'
        });



		var style = $('<style/>', {
            text: `
                /*
 CSS for the main interaction
*/
.multiswitch input {
  position: absolute;
  left: -150vw;
}

.multiswitch .slide-container {
  position: relative;
  display: flex;
  max-width: 120em;
  line-height: 2em;
  /* don't allow highlighting the text inside the toggle */
  user-select: none;
}

.multiswitch .slide-container label {
  /* Even though we're using "flex" to display, we have to assign widths so that we know exactly where to position the slide */
  width: 50%;
  text-align: center;
  padding-left: 1em;
  padding-right: 1em;
  z-index: 2;
}

.multiswitch .slide-container a {
  position: absolute;
  left: 50%;
  z-index: 1;
  height: 100%;
  width: 50%;
  transition: left 0.1s ease-out;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

/*
  Auto adjusting widths
*/
.multiswitch label:nth-last-child(6),
.multiswitch label:nth-last-child(6) ~ label,
.multiswitch label:nth-last-child(6) ~ a {
  width: 33.3334%;
}

.multiswitch label:nth-last-child(8),
.multiswitch label:nth-last-child(8) ~ label,
.multiswitch label:nth-last-child(8) ~ a {
  width: 25%;
}

.multiswitch label:nth-last-child(10),
.multiswitch label:nth-last-child(10) ~ label,
.multiswitch label:nth-last-child(10) ~ a {
  width: 20%;
}

.multiswitch label:nth-last-child(12),
.multiswitch label:nth-last-child(12) ~ label,
.multiswitch label:nth-last-child(12) ~ a {
  width: 16.6667%;
}

/*
 Slider
*/

/* all options, first selected */
.multiswitch input:checked ~ a {
  left: 0;
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
/* 2 options, 2nd selected */
.multiswitch label:nth-last-child(4) ~ input:nth-child(3):checked ~ a {
  left: 50%;
}
/* 3 options, 2nd selected */
.multiswitch label:nth-last-child(6) ~ input:nth-child(3):checked ~ a {
  left: 33.3334%;
  background: yellow;
}
/* 3 options, 3rd selected */
.multiswitch label:nth-last-child(6) ~ input:nth-child(5):checked ~ a {
  left: 66.6667%;
  background: red;
}
/* 4 options, 2nd selected */
.multiswitch label:nth-last-child(8) ~ input:nth-child(3):checked ~ a {
  left: 25%;
}
/* 4 options, 3rd selected */
.multiswitch label:nth-last-child(8) ~ input:nth-child(5):checked ~ a {
  left: 50%;
}
/* 4 options, 4th selected */
.multiswitch label:nth-last-child(8) ~ input:nth-child(7):checked ~ a {
  left: 75%;
}
/* 5 options, 2nd selected */
.multiswitch label:nth-last-child(10) ~ input:nth-child(3):checked ~ a {
  left: 20%;
}
/* 5 options, 3rd selected */
.multiswitch label:nth-last-child(10) ~ input:nth-child(5):checked ~ a {
  left: 40%;
}
/* 5 options, 4th selected */
.multiswitch label:nth-last-child(10) ~ input:nth-child(7):checked ~ a {
  left: 60%;
}
/* 5 options, 5th selected */
.multiswitch label:nth-last-child(10) ~ input:nth-child(9):checked ~ a {
  left: 80%;
}
/* 6 options, 2nd selected */
.multiswitch label:nth-last-child(12) ~ input:nth-child(3):checked ~ a {
  left: 16.6667%;
}
/* 6 options, 3rd selected */
.multiswitch label:nth-last-child(12) ~ input:nth-child(5):checked ~ a {
  left: 33.3334%;
}
/* 6 options, 4th selected */
.multiswitch label:nth-last-child(12) ~ input:nth-child(7):checked ~ a {
  left: 50%;
}
/* 6 options, 5th selected */
.multiswitch label:nth-last-child(12) ~ input:nth-child(9):checked ~ a {
  left: 66.6667%;
}
/* 6 options, 6th selected */
.multiswitch label:nth-last-child(12) ~ input:nth-child(11):checked ~ a {
  left: 83.3334%;
}

/*
  Slider shadows
*/
/* middle spots */
.multiswitch input:not(:first-child):checked ~ a {
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.2),
              -1px 0 0 rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
/* last spots */
.multiswitch label:nth-last-child(4) ~ input:nth-child(3):checked ~ a,
.multiswitch label:nth-last-child(6) ~ input:nth-child(5):checked ~ a,
.multiswitch label:nth-last-child(8) ~ input:nth-child(7):checked ~ a,
.multiswitch label:nth-last-child(10) ~ input:nth-child(9):checked ~ a,
.multiswitch label:nth-last-child(12) ~ input:nth-child(11):checked ~ a {
  box-shadow: -1px 0 0 rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
}


/*
 RH Brand Styling
*/
body {
  font: 10px/1.5em "Overpass", "Open Sans", Helvetica, sans-serif;
  color: #333;
}

fieldset {
  border: 0;
  padding: 0;
}

fieldset legend {
  display: block;
  margin-bottom: 10px;
  font-weight: 450;
}

.multiswitch .slide-container {
  background: #333;
  color: #fff;
  transition: background 0.1s ease-out;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.3);
}

.multiswitch .slide-container label {
  cursor: pointer;
  text-shadow: 0 1px 1px rgba(0, 0, 0, .4);
}

.multiswitch .slide-container a {
  background: #0088ce;
  border: 1px solid #005f90;

}
.multiswitch {
  width: 200px; /* adjust as needed */
  text-align: center;
}



/*
 Horizontal layout
*/
.switch {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

/*
 Because a11y
*/
.multiswitch input:focus ~ a {
  outline: 2px solid #0088ce;
}


/*
 Demo purposes only
*/
*,
*:before,
*:after {
  box-sizing: border-box;
}

body {
  padding: 5px;
}

fieldset {
margin-bottom: 10px
};
            `
        });

		box.append(style);
        $('body').append(box);

        var switchNames = ['Komentarz', 'Pamięć', 'Zasilanie', 'Obraz', 'Dźwięk', 'Dziury/Wgniecenia', 'Rysy', 'Akcesoria', 'Rysy akcesorii', 'Opakowanie'];

        for (var i = 0; i < 10; i++)
		{
            var switchFieldset = $('<fieldset/>', {
                class: 'multiswitch'
            });
            var switchContainer = $('<div/>', {
                class: 'slide-container'
            });
			var switchLabel = $('<p/>', {
				text: switchNames[i],
				style: 'text-align:center;, fontsize: 20px;'
			});
            var switchInput1 = $('<input/>', {
                type: 'radio',
                name: 'switch' + (i + 1),
                id: 'switch' + (i + 1) + 'Yes',
                checked: 'checked'
            });
            var switchLabel1 = $('<label/>', {
                for: 'switch' + (i + 1) + 'Yes',
                text: 'Tak'
            });
            var switchInput2 = $('<input/>', {
                type: 'radio',
                name: 'switch' + (i + 1),
                id: 'switch' + (i + 1) + 'Maybe'
            });
            var switchLabel2 = $('<label/>', {
                for: 'switch' + (i + 1) + 'Maybe',
                text: 'Nie wiem'
            });
            var switchSlide = $('<a/>', {
                class: 'slide',
                'aria-hidden': 'true'
            });
			var switchInput3 = $('<input/>', {
				type: 'radio',
				name: 'switch' + (i + 1),
				id: 'switch' + (i + 1) + 'No'
			});
			var switchLabel3 = $('<label/>', {
				for: 'switch' + (i + 1) + 'No',
				text: 'Nie'
			});


            switchContainer.append(switchInput1);
            switchContainer.append(switchLabel1);
            switchContainer.append(switchInput2);
            switchContainer.append(switchLabel2);
			switchContainer.append(switchInput3);
			switchContainer.append(switchLabel3);
            switchContainer.append(switchSlide);

			switchFieldset.append(switchLabel);
            switchFieldset.append(switchContainer);

            box.append(switchFieldset);
			$('input[name="switch' + (i + 1) + '"]').click(getSwitchValues);
			$('input[type="radio"][name="switch8"]').change(function() {
			if (this.id == 'switch8Yes' || this.id == 'switch8Maybe') {
					$('#accCheckBox').hide();
				} else {
					$('#accCheckBox').show();
				}
			});
			$(document).ready(function() {
				if ($('#switch8Yes').is(':checked') || $('#switch8Maybe').is(':checked')) {
					$('#accCheckBox').hide();
				} else {
					$('#accCheckBox').show();
				}
			});
        }
		function loadSwitchValues()
{
    var switchValues = JSON.parse(localStorage.getItem('switchValues'));
    if (switchValues)
    {
        for (var i = 0; i < 10; i++)
        {
            var switchName = switchNames[i];
            var switchValue = switchValues[switchName];
            if (switchValue)
            {
                $('input[name="switch' + (i + 1) + '"][id$="' + switchValue + '"]').prop('checked', true);
            }
        }
    }
}


        function getSwitchValues()
		{
			var switchValues = {};
			for (var i = 0; i < 10; i++)
			{
				var switchValue = $('input[name="switch' + (i + 1) + '"]:checked').attr('id');
				var switchName = switchNames[i];
				switchValues[switchName] = switchValue.endsWith('Yes') ? 'Yes' : switchValue.endsWith('No') ? 'No' : 'Maybe';
			}
			localStorage.setItem('switchValues', JSON.stringify(switchValues));
			return switchValues;
		}
		loadSwitchValues();

        async function executeCommands(switchValues)
		{
			var commands =
			[
				function() { return $("#verify-question-success").click(); },
                function() { return $('h4:contains("Does the item present an immediate safety risk?")').parent().parent().find('button:contains("No")').click(); },
                function() { return $("#continue-grading-btn-id").click(); },
				function() { return $('h4:contains("Does the item have a foreign plug type?")').parent().parent().find('button:contains("No")').click(); },
				function() { return $('h4:contains("Does the product have other problems related to its main function?")').parent().parent().find('button:contains("No")').click(); },
				function() { return $('h4:contains("Is the item missing pieces or part of the order?")').parent().parent().find('button:contains("None")').click(); },
				function() { return $('h4:contains("Has the item been cleaned of all fingerprints, debris and set to factory default settings?")').parent().parent().find('button:contains("Yes")').click(); },
				function() { return $('h4:contains("Has customer information been removed from the item and outer packaging?")').parent().parent().find('button:contains("Yes")').click(); }
			];

			async function executeCommand()
			{
				var z = 0;
				function execute()
				{
					if (z >= commands.length) return;
					commands[z++]();
					setTimeout(execute, 100);
				}
				execute();
			}
			await executeCommand();

			for (var switchName in switchValues)
			{
				var switchPosition = switchValues[switchName];
				var actions = questionsAndAnswers[switchName][switchPosition];
				if (actions)
        {
            for (var i = 0; i < actions.length; i++)
            {
                await actions[i]();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } else
        {
            console.log('No actions found for switch: ' + switchName + ', position: ' + switchPosition);
        }
			}
		}


       var questionsAndAnswers = {
    'Komentarz':
	{
        'Yes':
		[
            function() { return $('h4:contains("Read the Customer Comment. How would you best describe what the customer said?")').parent().parent().find('button:contains("Product has a problem or defect")').click(); },
            function() { return $('h4:contains("Test the item. Does the defect exist?")').parent().parent().find('button:contains("No - Product tested and functions properly")').click(); }
        ],
        'No':
		[
            function() { return $('h4:contains("Read the Customer Comment. How would you best describe what the customer said?")').parent().parent().find('button:contains("No comment given")').click(); }
        ]
    },
	'Pamięć':
	{
		'Yes':
		[
			function() { return $('h4:contains("Does the item have memory?")').parent().parent().find('button:contains("Yes")').click(); },
			function() { return $('h4:contains("Follow instruction manuals")').parent().parent().find('button:contains("Successful, using instruction manual")').click(); }
		],
		'No':
		[
			function() { return $('h4:contains("Does the item have memory?")').parent().parent().find('button:contains("No")').click(); }
			]
	},
	'Zasilanie':
	{
		'Yes':
		[
			function() { return $('h4:contains("Will the item power on?")').parent().parent().find('button:contains("Yes")').click(); }
			],
		'No':
		[
			function() { return $('h4:contains("Will the item power on?")').parent().parent().find('button:contains("Not Applicable")').click(); }
		]
	},
	'Obraz':
	{
		'Yes':
		[
			function() {$('h4:contains("Does the item have a screen/display?")').parent().parent().find('button:contains("Yes")').click(); },
			function() {$('h4:contains("Is the display free from flaws such as cosmetic damages, blurs, dead pixels etc?")').parent().parent().find('button:contains("No")').click(); },
			function() {$('h4:contains("Which of the following best describes the defect on the screen/display?")').parent().parent().find('button:contains("Scratches, minor cracks or other physical flaws that doesn")').click(); }

		],
		'No':
		[
			function() {$('h4:contains("Does the item have a screen/display?")').parent().parent().find('button:contains("No")').click(); }
		]
	},
	'Dźwięk':
	{
		'Yes':
		[
			function() {$('h4:contains("Does the item have a sound producing feature?")').parent().parent().find('button:contains("Yes")').click(); }
		],
		'No':
		[
			function() {$('h4:contains("Does the item have a sound producing feature?")').parent().parent().find('button:contains("No")').click(); }
		]
	},
	'Dziury/Wgniecenia':
	{
		'Yes':
		[
			function() {$('h4:contains("Please remove product from the box and conduct a 7-sided check. Does the item have any of the following physical damages?")').parent().parent().find('button:contains("Item has cracks, holes or dents")').click(); },
			function() {$('h4:contains("Is the item still usable to serve its function?")').parent().parent().find('button:contains("Yes")').click(); },
			function() {$('h4:contains("How big is the crack/hole or dent?")').parent().parent().find('button:contains("Small")').click(); }
		],
		'No':
		[
			function() {$('h4:contains("Please remove product from the box and conduct a 7-sided check. Does the item have any of the following physical damages?")').parent().parent().find('button:contains("None")').click(); }
		]
	},
	'Rysy':
	{
		'Yes':
		[
			function() {$('label:contains("Damage on front") input[type="checkbox"]').click(); },
			function() {$('label:contains("Damage on top") input[type="checkbox"]').click(); },
			function() {$('label:contains("Damage on sides") input[type="checkbox"]').click(); },
			function() {$('label:contains("Damage on back") input[type="checkbox"]').click(); },
			function() {$('h4:contains("Are there any scratches or blemishes?")').parent().parent().find('button:contains("Small")').click(); }
		],
		'No':
		[
			function() {$('label:contains("No") input[type="checkbox"]').click(); }
		]
	},
	'Akcesoria':
	{
		'Yes':
		[
			function() {$('h4:contains("Are all accessories present? Please check manual, outer box description or Amazon website for the list.")').parent().parent().find('button:contains("Yes")').click(); }
		],
		'No':
[
    function()
    {
        new Promise((resolve, reject) => {
            setTimeout(function()
            {
                $('h4:contains("Are all accessories present? Please check manual, outer box description or Amazon website for the list.")').parent().parent().find('button:contains("No")').click();
                resolve();
            }, 1000);
        }).then(() => {
            setTimeout(function()
            {
                var checkboxStates = JSON.parse(localStorage.getItem('checkboxStates')) || {};
                for (var option in checkboxStates)
                {
                    if (checkboxStates[option] === true)
                    {
                        $('label:contains("' + option + '") input[type="checkbox"]').click();
                    }
                }
            }, 1000);
        });
    }
]
	},
	'Rysy akcesorii':
	{
		'Yes':
		[
			function() {$('h4:contains("Do accessories have cracks, scratches or other blemishes?")').parent().parent().find('button:contains("Yes")').click(); }
		],
		'No':
		[
			function() {$('h4:contains("Do accessories have cracks, scratches or other blemishes?")').parent().parent().find('button:contains("No")').click(); }
		]

	},
	'Opakowanie':
	{
		'Yes':
		[
			function() {$('h4:contains("Is the item in its original packaging?")').parent().parent().find('button:contains("Yes")').click(); },
			function() {$('h4:contains("Is original packaging in pristine condition?")').parent().parent().find('button:contains("No")').click(); }
		],
		'No':
		[
			function() {$('h4:contains("Is the item in its original packaging?")').parent().parent().find('button:contains("No")').click(); }
		]
	},
};

var button = $('<button/>', {
    id: 'autoGrade',
    text: 'Auto Grading',
    style: 'position:fixed;bottom:10px;right:20px;'
});

var button1 = $('<button/>', {
    text: 'Show',
    style: 'position:fixed;top:10px;right:20px;',
    click: function() {
        $('#switchBoxes').toggle();
        if ($(this).text() === 'Show') {
            $(this).text('Hide');
        } else {
            $(this).text('Show');
        }
    }
});


var input = $('<input/>', {
    id: 'caseSN',
    style: 'position:fixed;bottom:1px;right:20px;'
});

$('body').append(input);
  var caseSNValue;

    $('#caseSN').on('blur', function(e) {
        var value = $(this).val();
        if (value !== '') {
            caseSNValue = value;
        } else {
			caseSNValue = "Brak Sn";
		}
		var data = {sn: caseSNValue};
            chrome.storage.local.set(data, function() {
                console.log('Value saved: ', caseSNValue);
            });
    });

$('body').append(button);
$('body').append(button1);

$('#autoGrade').click(function() {
    var lpnLabel = $('#lpn-label');
    if(lpnLabel){
        var switchValues = getSwitchValues();
        executeCommands(switchValues);
        (function() {
            if (lpnLabel.text().trim().startsWith('LPN')) {
                var tempInput = $("<input>");
                $("body").append(tempInput);
                tempInput.val(lpnLabel.text()).select();
                document.execCommand("copy");
                tempInput.remove();
                console.log('Copied to clipboard: ' + lpnLabel.text());
            }
        })();
    }
});

    }

});
const categoryPoints = {
	0.5 : 
	[
		'1050 Vehicle Electronics', 
		'2500 Electric Pianos', 
		'0330 Portable DVD Players', 
		'2706 Component - Turntables', 
		'2713 Portable / Clock Radios', 
		'5520 Surge Protector', 
		'4410 Audio Speakers', 
		'7550 Guitar Accessories'
	],
	0.55: [],
	0.6 : 
	[
		'0923 Lighting Accessories',
		'1012 Dimmers',
		'4450 Shelf Systems',
		'4110 Audio Speakers',
		'0830 Speakers',
		'4130 Premium Audio Speakers',
		'4420 Radios',
		'1080 TV cards'
	],
	0.65: [],
	0.7 : 
	[
		'2026 Hardware - Other',
		'5004 Measuring',
		'9008 Fire Safety',
		'9004 Door Security',
		'50038 Accessory - Sets',
		'1005 Modems & networking devices',
		'2300 Synt. and Workstation',
		'0520 Soundbars'
	],
	0.75: 
	[
		'1013 Door Chimes',
		'1013 Door Chimes',
		'1015 Graphics Cards Nvidia',
		'1015 Graphics Cards AMD',
		'1010 Graphics Cards Nvidia',
		'1020 Graphic Cards Other'
	],
	0.8 : 
	[
		'9001 Access Control',
		'9015 Security Alarms',
		'9010 Home Safety Products',
		'9016 Security and Intrusion Monitoring, CCTV',
		'4100 Sound Reinforcement',
		'4300 Computer Music',
		'5100 DJ Equipment',
		'0340 Blu-Ray Players'
	],
	0.85: 
	[
		'1055 Motherboards Intel',
		'1065 Motherboards other',
		'1065 Motherboards Other'
	],
	0.9 : 
	[
		'206 Laptops Google'
	],
	0.95: [],
	1.0 : 
	[
		'9017 Security Sets',
		'4400 Multitrack Recording',
		'125 Mini-PCs',
		'30212 Uprite Vacuum Bagless',
		'30209 Special Vacuums',
		'0201 Vacuums bagless',
	],
	1.05: [],
	1.1 : [],
	1.15: [],
	1.2 : 
	[
		'4210 Audio Receivers, Amp. Pre.',
		'00310 Nintendo DS Consoles',
		'00315 Nintendo 2DS/3DS Consoles',
		'00320 Nintendo Switch',
		'30904 Steam Irons',
		'30903 Steam Iron Stations',
		'30211 Stick Vacuum Cleaners',
		'30208 Robotic Vacuums',
		'225 Laptops Other'
	],
	1.25: [],
	1.3 : [],
	1.35: [],
	1.4 : 
	[
		'00355 Xbox One',
		'00340 PlayStation 4',
		'120 Desktops other',
		'105 Desktops Intel',
		'120 Desktops Other',
		'110 Desktops AMD',
		'0410 Home Theater Projectors',
		'540 Projectors'
	],
	1.45: [],
	1.5 : [],
	1.55: [],
	1.6 : 
	[
		'30210 Steam Cleaners',
	],
	1.65: []
};
  
  
  /* to mozna w sumie skrocic w chuj i callbacka trzeba czyms zastapic bo bedzie error wypierdalac bo "to nie funkcja" xD*/
chrome.storage.local.get('categories', ({ categories }) => {
    if (!categories) {
        chrome.storage.local.set({ categories: categoryPoints });
    }
});

async function getCategories() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('categories', ({ categories }) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(categories || {});
            }
        });
    });
}

async function pointCalculate($destination = $(document)) {
    const storedCategories = await getCategories();
    const subCategoryName = $destination.find("#TBoSubCategoryDesc").val();
    const gradingResult = $destination.find("#Maincontent_TBoGrading").val();
    let pointsErsa = 0.5;

    $.each(storedCategories, (points, categories) => {
        if (categories.includes(subCategoryName)) {
            pointsErsa = parseFloat(points);
        }
    });

    if (gradingResult) {
        const lowerCaseGradingResult = gradingResult.toLowerCase();
        const reductionTerms = ["liquidator", "donation", "liquidation", "stow:nonbmvd-unsellable"];
        if (reductionTerms.some(term => lowerCaseGradingResult.includes(term))) {
            pointsErsa *= 0.75;
            pointsErsa = Math.round(pointsErsa * 1000) / 1000;
        }
    }

    return pointsErsa;
}


async function getDataInformation($destination) {
    const data = {
        asin: $destination.find("#Maincontent_TBoCSSASIN").val(),
        casePL: $destination.find("#Maincontent_TBoCSSCaseID").val(),
        paleta: $destination.find("#Maincontent_TBoGrading").val(),
        cena: $destination.find("#HFCOGS").val(),
        lpn: $destination.find("#TBoCSSSerial").val(),
        points: await pointCalculate($destination)
    };
    return data;
}

async function yeldFunction($destination = $(document)) {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0].split('-').reverse().join('-');
    const data = await getDataInformation($destination);
    let stat = "";

    if (["liquidator", "donation", "liquidation", "stow:nonbmvd-unsellable"].some(term => data.paleta.toLowerCase().includes(term))) {
        stat = "liq";
    } else {
        stat = "sell";
    }

    data.paleta = stat;
    updateLPNData(formattedToday, data);
}

async function additionalInformation(enabled) {
    if (!enabled) return;

    console.log("ErsaSend-processed: additionalInformation");
    
    const divList = $(".col-lg-12.text-right");
    if (divList.length) {
        const newAsinValue = $("#Maincontent_TBoCSSASIN").val();
        const pointsValue = await pointCalculate();

        // Create newAsin input if it doesn't already exist
        if (!$("#newAsin").length) {
            const newAsin = $("<input>", {
                type: "text",
                id: "newAsin",
                value: newAsinValue,
            });
            divList.append(newAsin);
        }

        // Create punkty input if it doesn't already exist
        if (!$("#punkty").length) {
            const punkty = $("<input>", {
                type: "text",
                id: "punkty",
                value: pointsValue,
            });
            divList.append(punkty);
        }

        // Change type of #HFCOGS input to text
        $("#HFCOGS").prop("type", "text");
    }
}

function finalizeTabAlways(enabled)
{
    if (!enabled) return;
    document.querySelector('[href="#mfinalizecase"]').click();
    $(".DDbRepairOUtcomeResultAddionalDetailsdropdownlist").hide();
}
  
async function autoEditClick(enabled, $destination = $(document)) {
    if (!enabled) return Promise.reject();

    return new Promise(async (resolve) => {
        console.log("ErsaSend-processed: autoEditClick");
        const editLink = $destination.find("a.btn-default:contains('Edit')").first().attr("href");
        if (editLink) {
            const idTicketMatch = editLink.match(/IDTicket=([^&]+)/);
            const idTicket = idTicketMatch ? idTicketMatch[1] : null;

            const newHref = `https://oeufr1rsaxmw1.emea.intra.acer.com/PLRC/${editLink}`;
            const href = `https://ersa.emea.intra.acer.com/PLRC/${editLink}`;

            chrome.storage.sync.set({ key: idTicket }, () => {
                console.log("Value stored in local storage.");
            });

            const fetchHref = async (url) => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        destination.location.href = url;
                        return true;
                    }
                } catch (e) {
                    console.log(`Failed to fetch ${url}: ${e.message}`);
                }
                return false;
            };

            const newHrefFetched = await fetchHref(newHref);
            if (!newHrefFetched) {
                await fetchHref(href);
            } else {
                destination.location.href = newHref;
            }
        }
        await chrome.storage.session.set({ function: 1 });
        resolve("Operation autoEditClick completed!");
    });
}


function autoPickUp(enabled, $destination = $(document)) {
    if (!enabled) return Promise.reject();

    console.log("ErsaSend-processed: autoPickup");

    const repButton = $destination.find("#BTnPickupforRepair").first();
    const changeButton = $destination.find("#BTnChange").first();

    if (repButton.length && repButton.val() === "Pickup for Repair") {
        repButton.click();
        console.log("Pickup for Repair button clicked.");
    } else if (changeButton.length && changeButton.val() === "Under Repair") {
        changeButton.click();
        console.log("Under Repair button clicked.");
    } else {
        console.log("No appropriate button found to click.");
        return Promise.reject("No appropriate button found to click.");
    }

    return Promise.resolve("Operation autoPickUp completed!");
}

function autoCloseCase(enabled, $destination = $(document), sn) {
    if (!enabled) return;

    console.log("ErsaSend-processed: closeCase");

    const checkStatus = $destination.find("#Maincontent_TBoCSSStatus").val();
    const gradingResult = $destination.find("#Maincontent_TBoGrading").val();
    const checks = $destination.find("#Maincontent_TBoBlancco").val();

    /*
    chrome.storage.local.get("close_case", function(data) {
        if ((checkStatus === "Repair Complete" && (gradingResult.includes("Transfer:") || gradingResult.includes("Stow:NonBMVD-Sellable"))) || data.close_case === undefined) {
            const newValue = data.close_case === 1 ? 0 : 1;
            chrome.storage.local.set({ close_case: newValue });
        }
    });
    */

    const outcomes = getOutcomes();
    const outcomeDetails = getOutcomeDetails();
    const detailsTBox = getDetailsTBox();
    const codes = getCodes();

    if (gradingResult && checkStatus !== "Repair Complete") {
        console.log("handle grading");
        handleGradingResult(gradingResult, checkStatus, checks, outcomes, outcomeDetails, detailsTBox, codes, $destination, sn);
    }
}
  
function createRequiredButtons($destination = $(document)) {
    const buttons = [
        { id: 'not_needed', onClickValue: "ctl00$Maincontent$RPBlancooOverwrite$ctl01$ctl00" },
        { id: 'successfulll', onClickValue: "ctl00$Maincontent$RPBlancooOverwrite$ctl00$ctl00" },
        { id: 'refresh', onClickValue: "ctl00$Maincontent$BTnBlanccoRefresh" },
        { id: 'login', onClickValue: "ctl00$Maincontent$LBuUserAuto" },
        { id: 'close', onClickValue: "ctl00$Maincontent$BTnChange" }
    ];

    buttons.forEach(buttonConfig => {
        const button = $('<button>', {
            id: buttonConfig.id,
            onClick: `javascript:__doPostBack('${buttonConfig.onClickValue}','')`
        });
        $destination.find('body').append(button);
    });
}
  
function getOutcomes() {
	return {
	  REPAIRED: "Repaired",
	  OK: "No Trouble Found",
	  BER: "Beyond Economical Repair",
	  STOW: "Stow",
	  MISMATCH: "Mismatch"
	};
}
  
function getOutcomeDetails() {
	return {
	  REPAIRED: "Repaired. Tested and Cleaned",
	  STOW_REPAIRED: "Stow + Repaired. Tested and Cleaned",
	  OK: "Tested and Cleaned",
	  STOW_OK: "Stow + Tested and Cleaned",
	  BER: "LIQ-BER",
	  STOW_BER: "LIQ-BER + Stow",
	  MISMATCH: "LIQ-BER + Mismatch"
	};
}
  
function getDetailsTBox() {
	return {
	  REPAIRED: "Sellable|1|SUCCESS",
	  OK: "Sellable|0|SUCCESS",
	  STOW_REPAIRED: "STOW_Sellable|1|SUCCESS",
	  STOW_OK: "STOW_Sellable|0|SUCCESS",
	  BER: "Liquidation|0|NOTNEEDED",
	  STOW_BER: "STOW_Liquidation|0|NOTNEEDED",
	  MISMATCH: "Liquidation|0|NOTNEEDED"
	};
}
  
function getCodes() {
	return {
	  REPAIRED: "RO19",
	  OK: "RO20",
	  BER: "RO21",
	  STOW: "RO27",
	  MISMATCH: "RO35"
	};
}
  
function checkBlanco(destination = document) {
	const elementBlanco = destination.getElementById("Maincontent_BlanccoPanel");
	const blanco = elementBlanco.querySelector(".input-group-btn");
	const tableRows = blanco.querySelector("ul");
	const testElement = tableRows.getElementsByTagName("a");
	return testElement[0].innerText === "Successfully";
}
  
function clickButton(buttonId, destination = document) {
	destination.getElementById(buttonId).click();
}
  
function setInputValue(id, value, destination = document) {
	destination.getElementById(id).value = value;
}
  
function documentEdit(outcome, detailsOutcome, detailsTBox, code, destination = document) {
	setInputValue("Maincontent_DDbRepairOutcome_TBox", outcome, destination);
	setInputValue("Maincontent_DDbRepairOutcome_TboxValue", code, destination);
	setInputValue("Maincontent_DDbRepairOutcome_TBoxParameter", code, destination);
	setInputValue("Maincontent_DDbRepairOUtcomeResultAddionalDetails_TBox", detailsOutcome, destination);
	setInputValue("Maincontent_DDbRepairOUtcomeResultAddionalDetails_TboxValue", code, destination);
	setInputValue("Maincontent_DDbRepairOUtcomeResultAddionalDetails_TBoxParameter", detailsTBox, destination);
}
  
function closeBer(checkStatus, checks, destination = document) {
	console.log("close ber");
	let flag = 4;
	setInputValue("Maincontent_TBoInternalDiagnose", " ", destination);
	if (!checkBlanco(destination)) {
	  clickButton("BTnChange", destination);
	} else {
	  if (["Not Needed", "Not needed"].includes(checks)) {
		clickButton("BTnChange", destination);
	  } else if ((checkStatus === "Under Repair" && flag !== 0) || (checkStatus === "Under Testing" && flag !== 0)) {
		clickButton('not_needed', destination);
		flag = 0;
	  }
	  if (flag === 0) {
		clickButton('refresh', destination);
		clickButton("Maincontent_BTnSave", destination);
		flag = 0;
	  }
	}
}
  
async function closeOke(checkStatus, checks, destination = document, sn)
{
	console.log("destination", destination);
    const options = await chrome.storage.sync.get(
    {
        function6Enabled: true
    });
    if (options.function6Enabled)
    {
        const data = await chrome.storage.sync.get("blancoIdCase");
        if (checkStatus === "Under Repair")
        {
            if (destination.getElementById("Maincontent_TBoInternalDiagnose").value === "")
            {
                setInputValue("Maincontent_TBoInternalDiagnose", data.blancoIdCase);
                clickButton("Maincontent_BTnSave", destination);
                chrome.storage.local.set(
                {
                    key: ''
                }, function()
                {
                    console.log("Case removed");
                });
                chrome.storage.local.set(
                {
                    blancoIdCase: ''
                }, function()
                {
                    console.log("Sn removed");
                });
            }
            if (checkBlanco())
            {
                clickButton('successfulll', destination);
            }
            else
            {
                clickButton('refresh', destination);
            }
        }
        if (["Successfully", "Not Needed", "Not needed"].includes(checks))
        {
            clickButton("BTnChange", destination);
        }
    }
    else if (destination.getElementById("Maincontent_LBLWipingTitle").textContent === "Blancoo - Result" && data.blancoIdCase === "blanco fail")
    {
        setInputValue("Maincontent_TBoInternalDiagnose", data.blancoIdCase);
    }
    else
    {
        console.log("NORMAL CLOSE");
        if (destination.getElementById("Maincontent_TBoInternalDiagnose").value === '')
        {
            console.log('Value loaded: ', sn);
            setInputValue("Maincontent_TBoInternalDiagnose", sn, destination);
            if (["Successfully", "Not Needed", "Not needed"].includes(checks))
            {
                console.log("TEST END");
                clickButton("BTnChange", destination);
            }
            else
            {
                clickButton('successfulll', destination);
            }
        }
        else if (destination.getElementById("BTnChange").value === "Repair Complete")
        {
            clickButton("BTnChange", destination);
        }
    }
}
  
function handleGradingResult(gradingResult, checkStatus, checks, outcomes, outcomeDetails, detailsTBox, codes, destination ,sn) {
	const conditionsAndActions = [
	  {
		condition: ["Liquidator", "Donation"].some(term => gradingResult.includes(term)),
		outcome: outcomes.BER,
		outcomeDetail: outcomeDetails.BER,
		detailTBox: detailsTBox.BER,
		code: codes.BER,
		action: () => closeBer(checkStatus, checks, destination)
	  },
	  {
		condition: gradingResult.includes("Liquidation"),
		outcome: outcomes.MISMATCH,
		outcomeDetail: outcomeDetails.MISMATCH,
		detailTBox: detailsTBox.MISMATCH,
		code: codes.MISMATCH,
		action: () => {
		  setInputValue("Maincontent_TBoInternalDiagnose", " ");
		  if (!["Not Needed", "Not needed"].includes(checks)) {
			clickButton("Maincontent_BTnSave", destination);
		  }
		  if (checkStatus === "Under Repair" && !["Not Needed", "Not needed"].includes(checks)) {
			clickButton('not_needed', destination);
		  }
		}
	  },
	  {
		condition: gradingResult.includes("Stow:NonBMVD-Unsellable"),
		outcome: outcomes.STOW,
		outcomeDetail: outcomeDetails.STOW_BER,
		detailTBox: detailsTBox.STOW_BER,
		code: codes.STOW,
		action: () => closeBer(checkStatus, checks, destination)
	  },
	  {
		condition: gradingResult.includes("Stow:NonBMVD-Sellable"),
		action: () => {
		  documentEdit(outcomes.REPAIRED, outcomeDetails.STOW_REPAIRED, detailsTBox.STOW_REPAIRED, codes.REPAIRED, destination);
			closeOke(checkStatus, checks, destination, sn);
		}
	  },
	  {
		condition: gradingResult.includes("Transfer:"),
		action: () => {
		  /*chrome.storage.local.get("close_case", function(data) {
			if (data.close_case === 0) {
			  
			} else if (data.close_case === 1) {
			  documentEdit(outcomes.OK, outcomeDetails.OK, detailsTBox.OK, codes.OK, iframe);
			}
			
		  });*/
		  documentEdit(outcomes.REPAIRED, outcomeDetails.REPAIRED, detailsTBox.REPAIRED, codes.REPAIRED, destination);
		  closeOke(checkStatus, checks, destination,sn);
		}
	  }
	];
  
	conditionsAndActions.forEach(({ condition, outcome, outcomeDetail, detailTBox, code, action }) => {
	  if (condition) {
		if (outcome && outcomeDetail && detailTBox && code) {
		  documentEdit(outcome, outcomeDetail, detailTBox, code, destination);
		}
		action();
	  }
	});
  

}
    
async function loadFunctions() {

	createRequiredButtons();
	if(document.getElementById("DIVUserAuto") !== null)
	{
		let result = await new Promise(resolve => {
			chrome.storage.local.get(['caseLink'], resolve);
		});
		await clickButton("login");
		if(result.caseLink !== undefined) {
			if(result.caseLink.includes("emea") ){
				setTimeout(() => {
					document.location.href = result.caseLink;
				}, 500); // wait for 5 seconds before redirecting
			}
		}
	}
	const table = document.getElementById("Maincontent_DashboardI_DRToDo_DGToDo_0");
  
	if (table) {
		await chrome.storage.session.set({function:0});
	}
	
	chrome.storage.sync.get({
	  function3Enabled: true,
	  function2Enabled: true,
	  function1Enabled: true,
	  function4Enabled: true,
	  function5Enabled: true,
	  function6Enabled: true,
	},async (options) => {
	  	await finalizeTabAlways(options.function2Enabled);
	  	await additionalInformation(options.function1Enabled);
	  	await executeFunctions(options);
	});
	
}
  
async function executeFunctions(options)
{
    try
    {
        await autoEditClick(options.function3Enabled).then(async () =>
        {
            await autoPickUp(options.function4Enabled).then(async () =>
            {
                await autoCloseCase(options.function5Enabled);
            });
        });
        const checkStatus = document.getElementById("Maincontent_TBoCSSStatus")?.value;
        if (checkStatus === "Repair Complete")
        {
            await yeldFunction();
        }
        console.log("All functions executed successfully.");
    }
    catch (error)
    {
        console.log("Error executing functions:", error);
    }
}

function extractLpn()
{
    const lpnElement = document.querySelector('.col-md-5');
    if (!lpnElement) return null;
    const lpnText = lpnElement.innerText.split("\n")[1];
    if (!lpnText || !lpnText.includes('LPN')) return null;
    return lpnText;
}
function ersa(messageAction) {
	
	console.log("Message received from the extension background:", messageAction);
	try {
		loadFunctions();
		return { success: true };
	} catch (error) {
		console.log("Error in ersa function:", error);
		return { success: false, error: error.message };
	}
}  
async function amazon(messageAction)
{
    console.log("Message received from the extension background:", messageAction);
    try
    {
        const lpn = extractLpn();
        if (!lpn)
        {
            console.log("Amazon-processed: LPN not loaded or incorrect format");
            return {
                success: false,
                error: "LPN not loaded or incorrect format"
            };
        }
        const gradingResult = document.getElementById("gc-item-destination")?.innerHTML ?? null;
        const sendGradingData = {
            LPN: lpn,
            Result: gradingResult
        };
        document.getElementById("commit-grading-btn").addEventListener('click', async () =>
        {
            await chrome.storage.session.set(
            {
                'updateExecuted': false
            }, () =>
            {
                console.log("Amazon-processed: storage check set");
            });
        });
        console.log("Amazon-processed: Successful");
        return {
            success: true,
            jsonData: JSON.stringify(sendGradingData)
        };
    }
    catch (error)
    {
        console.error("Amazon-processed: Error:", error);
        return {
            success: false,
            error: error.message
        };
    }
}
  
function blanco(messageAction, enabled)
{
    console.log("Message received from the extension background:", messageAction);
    if (!enabled)
    {
        chrome.storage.local.set(
        {
            blancoIdCase: "blanco fail"
        });
        return {
            success: false
        };
    }
    var flag = 2;
    var caseIdElement = document.getElementById("TBoCaseID");
    let checkId = caseIdElement.value;
    chrome.storage.sync.get("key", function(data)
    {
        if (chrome.runtime.lastError)
        {
            chrome.storage.local.set(
            {
                blancoIdCase: "blanco fail"
            });
            console.error("Error retrieving data:", chrome.runtime.lastError.message);
        }
        else if (data.key)
        {
            caseIdElement.value = data.key;
            if (caseIdElement.value !== checkId)
            {
                document.getElementById("BTnCaseID").click();
            }
            let elem = document.getElementsByTagName("td");
            for (let i = 0; i < elem.length; i++)
            {
                if (elem[i].innerText.includes("Successful"))
                {
                    flag = 1;
                }
            }
            if (flag === 1)
            {
                const tableRows = document.getElementsByTagName("tr");
                if (tableRows.length < 3)
                {
                    chrome.storage.local.set(
                    {
                        blancoIdCase: "blanco fail"
                    });
                    console.log("Not enough table rows found.");
                    return {
                        success: false,
                        log: "Not enough table rows found"
                    };
                }
                const firstRowCells = tableRows[1].getElementsByTagName("td");
                const secondRowCells = tableRows[2].getElementsByTagName("td");
                if (firstRowCells.length < 2 || secondRowCells.length < 2)
                {
                    chrome.storage.local.set(
                    {
                        blancoIdCase: "blanco fail"
                    });
                    console.log("Not enough cells in table rows.");
                    return {
                        success: false,
                        log: "Not enough cells in table rows"
                    };
                }
                const testElementContent = firstRowCells[0].textContent;
                const blancoIdCase = (testElementContent === "FG Serial: ") ?
                    firstRowCells[1].textContent :
                    secondRowCells[1].textContent;
                console.log("blancoSetSN:", blancoIdCase);
                chrome.storage.local.set(
                {
                    blancoIdCase: blancoIdCase
                });
            }
        }
        else
        {
            chrome.storage.local.set(
            {
                blancoIdCase: "blanco fail"
            });
            console.log("No case ID found.");
            return {
                success: false,
                log: "No case ID found"
            };
        }
    });
    return {
        success: true
    };
}
function injectScript() {
    if (document.getElementById('customInjectButton')) return;
    const button = document.createElement('button');
	button.setAttribute("onClick","clearInterval(1)");
	document.body.appendChild(button);
	button.click();
	return { success: true };
}

async function storage() {
  const data = await chrome.storage.local.get({ page: {}, list: {} });
  return data;
}

function updateLPNData(date, info) {
	 storage().then((data) => {
		let dateData = data.page[date] || { ok: 0, ber: 0, points: 0 };

		let lpn    = info.lpn;
		let points = info.points;
		let cena   = info.cena;
		let status = info.paleta;
		let casePL = info.casePL;
		let asin   = info.asin;
		
		console.log("page:",data.page);
		console.log("lpn: ",data.list[lpn]);
		console.log("lpn list: ",data.list);

		if(data.list[lpn]) {
			 if (data.list[lpn].status === status) {
				console.log('LPN code "' + lpn + '" already exists in the data with the same status.');
				return;
			  }
				data.list[lpn] = {
					"date"   : date,
					"points" : points,
					"cena"   : cena,
					"status" : status,
					"case"   : casePL,
					"asin"   : asin
				  }; 

				if (status === 'liq') {
					dateData.ber += parseFloat(cena);
					dateData.ok  -= parseFloat(cena);
					dateData.points -= parseFloat(points) / 0.75;
					dateData.points += parseFloat(points);
				  } else if (status === 'sell') {
					dateData.ok += parseFloat(cena);
					dateData.ber -= parseFloat(cena);
					dateData.points -= parseFloat(points) * 0.75
					dateData.points += parseFloat(points);
				  }
					
				  data.page[date] = {
					"ok": dateData.ok,
					"ber": dateData.ber,
					"points": dateData.points
				  };
			  chrome.storage.local.set({ page: data.page }, function() {
				console.log('Data is updated in the local storage area.');
			  });
			  
			  
			console.log("LPN ISTNIEJE");
		} else {
			console.log('LPN code "' + lpn + '" doesn\'t exist in the data. Adding it.');
			data.list[lpn] = {
				"date"   : date,
				"points" : points,
				"cena"   : cena,
				"status" : status,
				"case"   : casePL,
				"asin"   : asin
			  };

			if (status === 'liq') {
				dateData.ber += parseFloat(cena);
				dateData.points += parseFloat(points);
			  } else if (status === 'sell') {
				dateData.ok += parseFloat(cena);
				dateData.points += parseFloat(points);
			  }
				
			  data.page[date] = {
				"ok": dateData.ok,
				"ber": dateData.ber,
				"points": dateData.points
			  };

		  chrome.storage.local.set({ page: data.page }, function() {
			console.log('Data is updated in the local storage area.');
		  });
		}
		chrome.storage.local.set({list: data.list}, function() {
			console.log('Data is updated in the local storage area.');
		});
			
	  });
}


chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
	if (message.tabDetails) {
		
	  console.log("Message sent from card ID:", message.tabDetails.tabId);
	  console.log("The card URL:", message.tabDetails.url);
	}
	if(message.tabDetails.url.includes("emea.intra.acer.com"))
	{
		sendResponse(injectScript());
		sendResponse(ersa(message.action));
	}
	if(message.tabDetails.url.includes("amazon.de"))
	{
		const response = await amazon(message.action);
		sendResponse(response);
	}
	if(message.tabDetails.url.includes("chlugmw14/blanccoCheck/"))
	{
		chrome.storage.sync.get({
		function6Enabled: true}, (options) => {
			sendResponse(blanco(message.action, options.function6Enabled));
		});
	}
});

chrome.runtime.sendMessage({ action: "contentScriptReady" });




function warjacjaNaTematWygladu() 
{
/*	
var panels = document.getElementsByClassName("panel");
var badge  = document.getElementsByClassName("badge");
var welcome  = document.querySelectorAll(".row > .col-lg-6");
var nav = document.getElementsByClassName("nav nav-tabs");
var row = document.querySelectorAll(".row");
if(nav[0]) 
{
nav[0].style.position = "relative";	
nav[0].style.paddingTop = "20px";
}

for (var i = 0; i < panels.length; i++) {
  panels[i].style.backgroundColor = "#2e3338b3";
}
for (var i = 0; i < badge.length; i++) {
  badge[i].style.display = "none";
}
  let e  = document.getElementsByClassName("col-lg-2");
  let e1 = document.getElementById("Maincontent_CustomerLogo");
  let e2 = document.getElementById("Maincontent_IMgVendorLogo");
  let e3 = document.getElementById("Maincontent_LBaTilteCaseID");
  let e4 = document.getElementById("Maincontent_TBoInternalDiagnose");
  let e5 = document.getElementById("Maincontent_TBoExternalDiagnose");
  let e6 = document.getElementById("Maincontent_BTnTextTemplpate");
  let e7 = document.getElementById("Maincontent_CBLCheckList");
  let e8 = document.getElementById("Maincontent_DDbRepairOutcome_TBox");
  let e9 = document.getElementById("Maincontent_DDbRepairOUtcomeResultAddionalDetails_TBox");
  
  
  if(e7)
  {
	  welcome[6].remove();
	  welcome[5].style.width = "100%";
	 e7.style.height = "30px";
     e7.style.background = "0";
     e7.style.border = "0";
  e7.style.color = "aliceblue";}
    if(e8){
	 e8.style.background = "#f9f9f903"; 
	 e8.style.color = "aliceblue";
	 e8.style.border = "none";
}if(e9){
	 e9.style.background = "#f9f9f903"; 
	 e9.style.color = "aliceblue";
	 e9.style.border = "none";
  }
  if(e5)
  {
	  e5.remove();

  }
  if(e6) 
  {
	  	  e6.remove();
  }
  if(e4) {
	  e4.style.background = "#f5f5dc00";
	  e4.style.border = "none";
	  e4.style.color = "aliceblue";
	  e4.style.resize = "none";
	  e4.style.width = "100%";
	  e4.style.height = "50px";
  }
  if(e[1]) {
	e[1].remove();
	}
	  if(e1) {
	e1.remove();
	}
		  if(e2) {
	e2.remove();
	}
			  if(e3) {
	e3.remove();
	}
  let wp = document.body;
  
  row[2].style.display = "grid";
  row[2].style.justifyItems = "center";
*/
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setBg") {
    getBg();
    console.log("Received 'setBg' message");
  }
});  
  
 

function updateBackground(base64String) {
	const bg = document.getElementById("bag");
	console.log("TEST TLA");
    // Create a new image element
	bg.style.backgroundRepeat = "no-repeat";
	bg.style.backgroundSize = "cover";
	bg.style.backgroundPosition = "center";
	bg.style.position = "absolute";
	bg.style.zIndex = "-1";
	bg.style.top = "0";
	bg.style.height = "100vh";
    bg.style.width = "100%";
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
function getBg() {
	chrome.storage.local.get('backgroundBlobErsa', (data) => {
		const base64String = data.backgroundBlobErsa;
		if (base64String) {
			updateBackground(base64String);
		}
	});
}
getBg();
  for (var i = 0; i < welcome.length; i++) {
	  

  welcome[0].innerText = "Siema Mistrzu";
  welcome[0].style.fontSize = "256px";
  welcome[0].style.display = "ruby";
  welcome[0].style.backgroundSize = "contain";
  welcome[0].style.backgroundRepeat = "no-repeat";
  welcome[0].style.backgroundPositionX = "left";
  welcome[0].style.width = "70%";
  welcome[0].style.backgroundImage = "url('data:image/png;base64,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')";

}
}