function addItem(category, item) {
  chrome.storage.local.get(['categories', 'keys'], ({ categories, keys }) => {
    if (categories) {
      if (category in categories) {
        categories[category].push(item);
      } else {
        console.log(`Category ${category} does not exist.`);
      }
      if (!keys.includes(category)) {
        keys.push(category);
      }
      chrome.storage.local.set({ categories, keys });
    }
  });
}


async function updateSidebar() {
	const categories = await callback();
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = ''; // Clear
	const sortedKeys = Object.keys(categories).map(Number).sort((a, b) => a - b);

    for (const key of sortedKeys) {
      const listItem = document.createElement('li');
	  listItem.setAttribute("class", "pointsList");
      listItem.innerHTML = `<span class="key">Wartosc: ${key}</span>`;
      const addButton = document.createElement('button');
      addButton.textContent = 'Add';
      addButton.setAttribute("id", "addButton");
      addButton.addEventListener('click', () => {
        const newItem = prompt('Enter the new item:');
        if (newItem) {
          categories[key].push(newItem);
          chrome.storage.local.set({ categories }, updateSidebar);
        }
      });
      listItem.appendChild(addButton);

      const subList = document.createElement('ul');
	  subList.setAttribute("style", " min-width:275px;min-height:1px");
      categories[key].forEach((item) => {
        const subListItem = document.createElement('li');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = item;
        input.addEventListener('change', (e) => {
          // Updt it in cat
          const index = categories[key].indexOf(item);
          categories[key][index] = e.target.value;
          chrome.storage.local.set({ categories }, updateSidebar);
        });
        subListItem.appendChild(input);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.setAttribute("id", "removeButtonPoints");
        deleteButton.addEventListener('click', () => {
          const index = categories[key].indexOf(item);
          if (index > -1) {
            categories[key].splice(index, 1);
            chrome.storage.local.set({ categories }, updateSidebar);
          }
        });
        subListItem.appendChild(deleteButton);
		
        subList.appendChild(subListItem);
      });
		
      listItem.appendChild(subList);
      categoriesList.appendChild(listItem);
    }
}

async function callback() {
	return await getCategories();
};

/*na szybko co mi do glowy przychodzi*/

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

document.getElementById('toggle-sidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar.classList.contains('visible')) {
    sidebar.classList.remove('visible');
  } else {
    sidebar.classList.add('visible');
    updateSidebar();
  }
});
