/********************************/
/* Quick Seledct/Create Element */
/********************************/

// $    alias for document.querySelector
const $ = selector => document.querySelector(selector);
// $$    alias for document.querySelectorAll
const $$ = selector => document.querySelectorAll(selector);
// _    function to create new elements
// tag - type of element e.g. img
// props - object of key value pairs of properties to be applied e.g. {src: '/myImage.png', alt: 'An example Image'}
// classList - array of class strings to be added e.g. ['class1', 'class2']
const _ = (tag, props, classList) => {
    // create Element
    let node = document.createElement(tag);
    if (props) {
        //for each key value pair, set the key to the value
        Object.entries(props).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                // check to ensure css is applied for td-links boxes
                if (key == 'dataset') {
                    Object.entries(value).forEach(([dataKey, dataValue]) => node.dataset[dataKey] = dataValue);
                } else {
                    node[key] = value;
                }
            }
        });
    }
    // add classes
    if (classList) {
        node.classList.add(...classList.filter(x => x !== null && x !== undefined));
    }
    //return newly created Element
    return node;
};
export const _option = (value) => _('option', { value })._(value);


/***********************/
/* Prototype Overrides */
/***********************/

// HTMLElement
{
    // $    alias for querySelector
    HTMLElement.prototype.$ = function (selector) { return this.querySelector(selector); };
    // $$    alias for querySelectorAll
    HTMLElement.prototype.$$ = function (selector) { return this.querySelectorAll(selector); };
    // _    function to append items.
    HTMLElement.prototype._ = function (...items) {
        items.forEach(item => {
            if (item !== undefined && item !== null) {
                if (Array.isArray(item)) {
                    this._(...item);
                } else {
                    // else append the object as it is
                    this.append(item);
                }
            }
        });
        // function returns the element on which it was called (can be used to chain appends)
        return this;
    };
    // __    alias for replaceChildren
    HTMLElement.prototype.__ = function (...children) { this.replaceChildren(...children); return this; };
}

// NodeList, HTMLCollection
// (both array like objects)
{
    // map    add Array.map to array like objects
    NodeList.prototype.map = function (fn) { return Array.from(this).map(fn); }
    HTMLCollection.prototype.map = function (fn) { return Array.from(this).map(fn); }
    // reduce    add Array.reduce to array like objects
    NodeList.prototype.reduce = function (fn, initialValue) { return Array.from(this).reduce(fn, initialValue); }
    HTMLCollection.prototype.reduce = function (fn, initialValue) { return Array.from(this).reduce(fn, initialValue); }
}

// Object
{
    // on    alias of addEventListener
    Object.prototype.on = function (eventType, fn) { this.addEventListener(eventType, fn); return this; };

    // do    alias of dispatchEvent with new Event
    Object.prototype.do = function (eventType) { this.dispatchEvent(new Event(eventType)); return this; };

    // entries    alias of Object.entries
    Object.prototype.entries = function () { return Object.entries(this); };

    // keys    alias of Object.keys
    Object.prototype.keys = function () { return Object.keys(this); };

    // values    alias of Object.values
    Object.prototype.values = function () { return Object.values(this); };

    // foreach    alias of foreach called on Object.entries
    Object.prototype.forEach = function (fn) { this.entries().forEach(fn); };

    // map    alias of map called on Object.entries
    Object.prototype.map = function (fn) { return this.entries().map(fn); };

    // reduce    alias of reduce called on Object.entries
    Object.prototype.reduce = function (fn, initialValue) { return this.entries().reduce(fn, initialValue); };
}

// Array
{
    // append    push item to array and return array
    Array.prototype.append = function (...items) { this.push(...items); return this; };
    // reduce    remove item from array and return array
    Array.prototype.remove = function (item) { let index = this.indexOf(item); if (index != -1) { this.splice(index, 1) }; return this; };
    // unique    remove duplicates and return array
    Array.prototype.unique = function () { return this.filter((item, index) => this.indexOf(item) === index).sort(); };
    Array.prototype.uniqueNoSort = function () { return this.filter((item, index) => this.indexOf(item) === index); };
}

// InputElement
{
    // Override built-in checkValidity function to return false if empty
    HTMLInputElement.prototype._checkValidity = HTMLInputElement.prototype.checkValidity;
    HTMLInputElement.prototype.checkValidity = function () { return Boolean(this.value) && this._checkValidity() }
    
}

/***************************/
/* Register Service Worker */
/***************************/
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register('./worker.js')
}

/*****************************/
/* Actual Shopping List Code */
/*****************************/
const main = $('main');

// cleanupFn()
// clears current view returns true to continue or false to stop
async function cleanupFn() {
    switch (main.dataset.page) {
        case 'list':
            saveList()
        default:
            return true;
    }
};
let savedInfo;
async function loadList(listId) {
    if (!(await cleanupFn())) { return; }
    savedInfo = JSON.parse(localStorage.getItem(`list_${listId}`));
    main.dataset.page = 'list';
    main.dataset.listId = listId;
    main.dataset.listName = savedInfo.name;
    let newItemIdInput, categorySelect, itemSelect, quantityInput, quantitySelect, itemNoteInput, addButton;
    main.__(
        _('h2')._(savedInfo.name),
        _('section')._(...savedInfo.list.entries().sort(([a, x], [b, y]) => a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0).map(([category, items]) => items.keys().length ? _('fieldset', null, ['listThing'])._(
            _('legend')._(category),
            ...items.entries().map(([itemId, { item: name, quantity: quantityValue, quantityType: quantityType, note: note, ticked: ticked }]) => _('div', { dataset: { ticked } })._(
                _('span', null, ['tickicon'])._(_('input', { type: 'checkbox', checked: ticked }).on('click', () => {
                    savedInfo.list[category][itemId].ticked = !savedInfo.list[category][itemId].ticked;
                    loadList(listId);
                }), '\u2003'),
                _('span', null, ['content'])._(
                    _('strong')._(name),
                    _('span')._(`${quantityValue}\u2002${quantityType}`),
                    _('span')._(note)
                ),
                _('span', null, ['buttons'])._(
                    _('button')._('Edit').on('click', () => {
                        newItemIdInput.value = itemId;
                        categorySelect.value = category;
                        categorySelect.do('change');
                        itemSelect.value = name;
                        itemSelect.do('change');
                        quantityInput.value = quantityValue;
                        quantitySelect.value = quantityType;
                    }),
                    _('button', null, ['delete'])._('Delete').on('click', () => {
                        savedInfo.list[category][itemId] = undefined;
                        loadList(listId);
                    })
                )
            ))
        ) : null)),
        _('section', null, ['newThing'])._(
            newItemIdInput = _('input', { type: 'hidden' }),
            _('label')._(
                'Category',
                categorySelect = _('select')._(_('option'), ...JSON.parse(localStorage.getItem('categoryList') ?? '[]').unique().map(_option)).on('change', () => {
                    itemSelect.disabled = false;
                    quantityInput.disabled = true;
                    quantitySelect.disabled = true;
                    itemNoteInput.disabled = true;
                    itemSelect.__(
                        _('option'),
                        ...JSON.parse(localStorage.getItem(`category_${categorySelect.value}`) ?? '[]').unique().map(_option)
                    )
                    addButton.disabled = true;
                })
            ),
            _('label')._(
                'Item',
                itemSelect = _('select', { disabled: true }).on('change', () => {
                    quantityInput.disabled = false;
                    quantityInput.value = null;
                    quantitySelect.disabled = false;
                    quantitySelect.__(
                        _('option'),
                        ...JSON.parse(localStorage.getItem(`item_${categorySelect.value}_${itemSelect.value}`) ?? '[]').unique().map(_option)
                    );
                    itemNoteInput.disabled = false;
                    itemNoteInput.value = null;
                    addButton.disabled = true;
                })
            ),
            _('label')._('Quantity', quantityInput = _('input', { type: 'number', disabled: true }), quantitySelect = _('select', { disabled: true }).on('change', () => addButton.disabled = false)),
            _('label')._('Note', itemNoteInput = _('input', { type: 'text', disabled: true })),
            addButton = _('button', { disabled: true })._('Add to List').on('click', () => {
                if (!(categorySelect.value && itemSelect.value && quantityInput.checkValidity() && quantitySelect.value)) { return; }
                const newItemId = newItemIdInput.value || Date.now();
                if ((savedInfo.list.keys().indexOf(categorySelect.value) == -1)) { savedInfo.list[categorySelect.value] = {} }
                savedInfo.list[categorySelect.value][newItemId] = { item: itemSelect.value, quantity: quantityInput.value, quantityType: quantitySelect.value, note: itemNoteInput.value, ticked: false };
                loadList(listId);
            })
        )
    );
}
function saveList() {
    localStorage.setItem(`list_${main.dataset.listId}`, JSON.stringify(savedInfo));
    savedInfo = undefined;
    main.dataset.listId = null;
    main.dataset.listName = null;
}

// Button click functions
$('nav > button[name=new]').on('click', async () => {
    main.dataset.page = 'new';
    let listNameInput;
    main.__(
        _('h2')._('New Shopping List'),
        _('section', null, ['newThing'])._(
            _('label')._('List Name', listNameInput = _('input', { type: 'text', value: 'New List' })),
            _('button')._('Create List').on('click', () => newList(listNameInput.value))
        )
    );
});
function newList(name, json) {
    const id = Date.now();
    localStorage.setItem(`list_${id}`, json??JSON.stringify({ name: name, list:{} }));
    const listOfLists = JSON.parse(localStorage.getItem('list_id_list') ?? '{}');
    listOfLists[id] = name;
    localStorage.setItem('list_id_list', JSON.stringify(listOfLists));
    loadList(id);
}
$('nav > button[name=lists]').on('click', async () => {
    if (!(await cleanupFn())) { return; }
    main.dataset.page = 'listoflists';
    renderLists();
}).do('click');
function renderLists() {
    const listOfLists = JSON.parse(localStorage.getItem('list_id_list') ?? '{}');
    main.__(
        _('h2')._('Available Shopping Lists'),
        _('section', null, ['listThing'])._(...listOfLists.entries().map(([listId, listName]) => _('div')._(
            _('strong')._(
                listName,
                _('br'),
                _('small')._(`Created: ${new Date(Number(listId)).toISOString().replace('T', '\u2002').substring(0, 16)}`)
            ),
            _('span', null, ['buttons'])._(
                _('button')._('Load list').on('click', () => loadList(listId)),
                _('button', null, ['delete'])._('Delete').on('click', () => {
                    listOfLists[listId] = undefined;
                    localStorage.setItem('list_id_list', JSON.stringify(listOfLists));
                    localStorage.removeItem(`list_${listId}`);
                    renderLists();
                })
            )
        )))
    );
};
$('nav > button[name=editThings]').on('click', async () => {
    if (!(await cleanupFn())) { return; }
    main.dataset.page = 'editoptions';
    renderCategories();
});
function renderCategories() {
    const categoryList = JSON.parse(localStorage.getItem('categoryList') ?? '[]').unique();
    let newCategoryInput;
    main.__(
        _('h2')._('Edit Categories'),
        _('section', null, ['listThing'])._(...categoryList.map(category => _('div')._(
            _('strong')._(category),
            _('span', null, ['buttons'])._(
                _('button')._('Edit Items').on('click', () => {
                    editCategory(category);
                }),
                _('button', null, ['delete'])._('Delete').on('click', () => {
                    localStorage.setItem('categoryList', JSON.stringify(categoryList.remove(category)));
                    JSON.parse(localStorage.getItem(`category_${category}`) ?? '[]').unique().forEach(item => localStorage.removeItem(`item_${category}_${item}`));
                    localStorage.removeItem(`category_${category}`);
                    renderCategories();
                })
            )
        ))),
        _('section', null, ['newThing'])._(
            _('label')._('New Category', newCategoryInput = _('input', { type: 'text' })),
            _('button')._('Add Category').on('click', () => {
                if (!(newCategoryInput.checkValidity())) { return; }
                localStorage.setItem('categoryList', JSON.stringify(categoryList.append(newCategoryInput.value).unique()));
                localStorage.setItem(`category_${newCategoryInput.value}`, JSON.stringify(JSON.parse(localStorage.getItem(`category_${newCategoryInput.value}`) ?? '[]')));
                editCategory(newCategoryInput.value);
            })
        )
    );
};
function editCategory(category) {
    const itemList = JSON.parse(localStorage.getItem(`category_${category}`) ?? '[]').unique();
    let newItemName, quantatyList;
    main.__(
        _('h2')._(`Edit ${category} Items`),
        _('section', null, ['listThing'])._(...itemList.map(item => _('div')._(
            _('strong')._(item),
            _('span', null, ['buttons'])._(
                _('button')._('Edit Item').on('click', () => {
                    newItemName.value = item;
                    const itemQuantaties = JSON.parse(localStorage.getItem(`item_${category}_${item}`));
                    quantatyList.forEach(label => label.$('input').checked = (itemQuantaties.indexOf(label.dataset.name) != -1));
                }),
                _('button', null, ['delete'])._('Delete').on('click', () => {
                    localStorage.setItem(`category_${category}`, JSON.stringify(itemList.remove(item)));
                    localStorage.removeItem(`item_${category}_${item}`);
                    editCategory(category);
                })
            )
        ))),
        _('section', null, ['newThing'])._(
            _('label')._('New Item', newItemName = _('input', { type: 'text' })),
            _('button')._('Save Item').on('click', () => {
                if (newItemName.checkValidity()) {
                    localStorage.setItem(`category_${category}`, JSON.stringify(itemList.append(newItemName.value).unique()));
                    localStorage.setItem(`item_${category}_${newItemName.value}`, JSON.stringify(quantatyList.filter(label => label.$('input').checked).map(label => label.dataset.name)));
                    editCategory(category);
                }
            }),
            _('fieldset')._(_('legend')._('Quantities'), ...(quantatyList = [
                'Unit(s)', 'Bag(s)', 'Bottle(s)', 'Can(s)', 'Jar(s)', 'Box(es)', 'Pack(s)', 'Pot(s)', 'Punnet(s)', 'Tin(s)', 'g', 'kg', 'oz', 'lbs', 'ml', 'cl', 'L', 'fl oz', 'Pint(s)'
            ].map(name => _('label', { dataset: { name } })._(name, _('input', { type: 'checkbox', name })))))
        )
    );
}
$('nav > button[name=manageData]').on('click', async () => {
    if (!(await cleanupFn())) { return; }
    main.dataset.page = 'manageData';
    const categoryDataJSON = JSON.stringify(JSON.parse(localStorage.getItem('categoryList') ?? '[]').unique().map(
        category => ({
            category, items: JSON.parse(localStorage.getItem(`category_${category}`) ?? '[]').unique().map(
                item => ({ item, quantities: JSON.parse(localStorage.getItem(`item_${category}_${item}`)) })
            )
        })
    ), null, 4),
        listEntries = JSON.parse(localStorage.getItem('list_id_list') ?? '{}').entries();
    main.__(
        _('h2')._('Manage Data'),
        _('section', null, ['listThing'])._(
            _('h3')._('Export Data'),
            _('div', null, ['json'])._(
                'Categories & Items',
                _('small', null, ['json'])._(categoryDataJSON),
                _('a', {
                    href: encodeURI(`data:text/json;charset=utf-8,${categoryDataJSON}`), download: 'shopping_list_categories_+_items.json', role: 'button'
                }, ['button'])._('Download')
            ),
            ...listEntries.map(([listId, listName]) => _('div', null, ['json'])._(
                `List: ${listName}`,
                _('small')._(`Created: ${new Date(Number(listId)).toISOString().replace('T', '\u2002').substring(0, 16)}`),
                _('small', null, ['json'])._(JSON.stringify(JSON.parse(localStorage.getItem(`list_${listId}`)), null, 4)),
                _('a', {
                    href: encodeURI(`data:text/json;charset=utf-8,${localStorage.getItem(`list_${listId}`)}`), download: `${listName}_${listId}.json`, role: 'button'
                }, ['button'])._(`Download`)
            ))
        ),
        _('section')._(
            _('h3')._('Import Data'),
            _('label')._('Categories & Items', _('input', { type: 'file' }).on('input', function () {
                new FileReader().on('load', ({ target: { result: json } }) => JSON.parse(json).forEach(({ category: category, items: items }) => {
                    localStorage.setItem('categoryList', JSON.stringify(JSON.parse(localStorage.getItem('categoryList') ?? '[]').append(category).unique()));
                    localStorage.setItem(`category_${category}`, JSON.stringify(JSON.parse(localStorage.getItem(`category_${category}`) ?? '[]').append(...items.map(item => item.item)).unique()));
                    items.forEach(({ item: item, quantities: quantities }) => localStorage.setItem(`item_${category}_${item}`, JSON.stringify(quantities.uniqueNoSort())));
                    location.reload(true);
                })).readAsText(this.files[0]);
            })),
            _('label')._('Shopping list', _('input', { type: 'file' }).on('input', function () {
                new FileReader().on('load', ({ target: { result: json } }) => {
                    newList(JSON.parse(json).name, json);
                }).readAsText(this.files[0]);
            }))
        ),
        _('section')._(
            _('h3')._('Other Data Options'),
            _('button')._('Reload Page').on('click', () => {
                location.reload(true);
            }),
            _('button', null, ['delete'])._('Clear ALL Data').on('click', () => {
                localStorage.clear();
                location.reload(true);
            }),
        )
    )
});