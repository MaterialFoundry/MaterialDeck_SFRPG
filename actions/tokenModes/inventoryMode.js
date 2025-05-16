import { Helpers } from "../../helpers.js";

const localize = Helpers.localize;

function getDocs(path, action="token") {
    return Helpers.getDocumentationUrl(path, action);
}

let inventoryOffset = 0;

export const inventoryMode = {

    updateAll: function() {
        for (let device of game.materialDeck.streamDeck.deviceManager.devices) {
            for (let button of device.buttons.buttons) {
                if (game.materialDeck.Helpers.getButtonAction(button) !== 'token') continue;
                if (game.materialDeck.Helpers.getButtonSettings(button).mode !== 'inventory') continue;
                button.update('md-sfrpg.updateAllTokenInventory')
            }
        }
    },

    getActions: function(settings) {
        let actions = { update: [], keyDown: [], keyUp: [], hold: [] };
        const holdTime = game.materialDeck.holdTime;

        const inventorySettings = settings.inventoryMode;

        if (inventorySettings.mode === 'offset') {
            actions.update.push({
                run: this.onOffsetUpdate
            });
            actions.keyDown.push({
                run: this.onOffsetKeydown
            })
        }

        else if (inventorySettings.mode === 'setSyncFilter') {
            actions.update.push({
                run: this.onSetSyncFilterUpdate,
                on: ['md-token-PageSettingChanged']
            });
            actions.keyDown.push({
                run: this.onSetSyncFilterKeydown
            })
        }
        
        else {
            actions.update.push({
                run: this.onInventoryUpdate,
                on: ['updateItem', 'refreshToken']
            });
            
            const onPress = inventorySettings.keyUp.mode;
            const onHold = inventorySettings.hold.mode;
            
            if (onPress === 'useItem') {
                actions.keyUp.push({
                    run: this.onKeypressUseItem,
                    stopOnHold: true
                });
            }
            if (onHold === 'useItem') {
                actions.hold.push({
                    run: this.onKeypressUseItem,
                    delay: holdTime
                });
            }

            if (onPress === 'equip') {
                actions.keyUp.push({
                    run: this.onKeypressEquip,
                    stopOnHold: true
                });
            }
            if (onHold === 'equip') {
                actions.hold.push({
                    run: this.onKeypressEquip,
                    delay: holdTime
                });
            }
        }
        
        return actions;
    },

    onOffsetUpdate: function(data) {
        const settings = data.settings.inventoryMode.offset;
        let icon = '';
        if (data.settings.display.inventoryMode.offsetIcon) {
            if (settings.mode === 'set' || settings.value == 0) icon = 'fas fa-arrow-right-to-bracket';
            else if (settings.value > 0) icon = 'fas fa-arrow-right';
            else if (settings.value < 0) icon = 'fas fa-arrow-left';
        }
        
        return {
            icon,
            text: data.settings.display.inventoryMode.offset ? inventoryOffset : '',
            options: {
                border: true,
                borderColor: (settings.mode === 'set' && inventoryOffset == parseInt(settings.value)) ? data.settings.colors.system.on : data.settings.colors.system.off
            }
        }
    },

    onOffsetKeydown: function(data) {
        const settings = data.settings.inventoryMode.offset;
        if (settings.mode === 'set') inventoryOffset = parseInt(settings.value);
        else if (settings.mode === 'increment') inventoryOffset += parseInt(settings.value);

        inventoryMode.updateAll();
    },

    onSetSyncFilterUpdate: function(data) {
        const mode = data.settings.inventoryMode.setSync.mode;
        const displaySettings = data.settings.display.inventoryMode.setSync;
        
        let text = displaySettings.name ? getItemTypes().find(t => t.value === mode)?.label : '';
        const thisSelected = game.materialDeck.Helpers.isSynced(data.settings.inventoryMode.setSync, 'inventoryMode.syncFilter', 'inventoryMode.',  'token');

        return {
            text,
            options: {
                border: true,
                borderColor: thisSelected ? data.settings.colors.system.on : data.settings.colors.system.off
            }
        }
        
    },

    onSetSyncFilterKeydown: function(data) {
        const settings = data.settings.inventoryMode.setSync;

        let syncedSettings = [
            { key: 'inventoryMode.mode', value: settings.mode },
            { key: 'inventoryMode.selection.filter.equipped', value: settings.selection.filter.equipped },
            { key: 'inventoryMode.selection.filter.unequipped', value: settings.selection.filter.unequipped },
            { key: 'inventoryMode.selection.filter.unequippable', value: settings.selection.filter.unequippable },
            { key: 'inventoryMode.selection.filter.identified', value: settings.selection.filter.identified },
            { key: 'inventoryMode.selection.filter.unidentified', value: settings.selection.filter.unidentified },
        ]

        data.button.sendData({
            type: 'setPageSync',
            payload: {
                context: data.button.context,
                device: data.button.device.id,
                action: 'token',
                sync: 'inventoryMode.syncFilter',
                settings: syncedSettings
            }
        })
    },

    onInventoryUpdate: function(data) {
        if (!data.actor) return;
        const settings = data.settings.inventoryMode;
        const item = getItem(data.actor, settings);
        if (!item) return;

        if (data.hooks === 'updateItem' && data.args[0].id !== item.id) return 'doNothing';
        if (data.hooks === 'refreshToken' && data.args[0].id !== token.id) return 'doNothing';
        
        let text = "";
        let options = {};

        const displaySettings = data.settings.display.inventoryMode;
        if (displaySettings.name) text = item.name;
        if (displaySettings.box === 'quantity') options.uses = { available: item.system.quantity, box: true }; 
        else if (displaySettings.box === 'capacity') options.uses = { available: item.system.capacity?.value, maximum: item.system.capacity?.max, box: true };

        if (settings.keyUp.mode === 'equip') {
            options.border = true;
            options.borderColor = item.system.equipped ? data.settings.colors.system.on : data.settings.colors.system.off
        }

        return {
            text, 
            icon: displaySettings.icon ? item.img : '', 
            options
        };
    },

    onKeypressUseItem: function(data) {
        if (!data.actor) return;
        const settings = data.settings.inventoryMode;
        const onPressSettings = settings[data.actionType];
        const item = getItem(data.actor, settings);
        
        if (!item) return;
        Helpers.rollItem(item, onPressSettings);
    },

    onKeypressEquip: function(data) {
        if (!data.actor) return;
        const settings = data.settings.inventoryMode;
        const mode = settings[data.actionType].equip.mode;
        const item = getItem(data.actor, settings);
        if (!item) return;
        
        if (mode === 'toggle') item.update({"system.equipped": !item.system.equipped});
        else if (mode === 'equip') item.update({"system.equipped": true});
        else if (mode === 'unequip') item.update({"system.equipped": false});
    },

    getSelectionSettings(type='', sync='inventoryMode.syncFilter') {

        let modeOptions = [];
        if (type === '') 
            modeOptions = [ 
                { label: localize("DOCUMENT.Item", "ALL"), children: getItemTypes()},
                { value: 'setSyncFilter', label: localize('SetTypeAndFilterSync') },
                { value: 'offset', label: localize('Offset', 'MD') }
            ]
        else modeOptions = getItemTypes()

        return [{
            label: localize('ItemType'),
            id: `inventoryMode${type}.mode`,
            type: "select",
            default: "any",
            link: getDocs('#inventory-mode'),
            sync,
            options: modeOptions
        },{
            label: localize("SelectionFilter"),
            id: `inventoryMode${type}-selectionFilter-table`,
            type: "table",
            visibility: { 
                hideOn: [ 
                    { [`inventoryMode.mode`]: "offset" },
                    { [`inventoryMode.mode`]: type === "" ? "setSyncFilter" : "" } 
                ] 
            },
            columns: 
            [
                { label: localize('Items.Equipped', 'SFRPG') },
                { label: localize('Unequipped') },
                { label: localize('Unequippable') }
            ],
            rows: 
            [
                [
                    { 
                        id: `inventoryMode${type}.selection.filter.equipped`,
                        type: "checkbox",
                        sync,
                        default: true
                    },{ 
                        id: `inventoryMode${type}.selection.filter.unequipped`,
                        type: "checkbox",
                        sync,
                        default: true
                    },{ 
                        id: `inventoryMode${type}.selection.filter.unequippable`,
                        type: "checkbox",
                        sync,
                        default: true
                    }
                ],[
                    { 
                        label: localize('Items.Identified', 'SFRPG'),
                        type: 'label',
                        font: 'bold'
                    },{ 
                        label: localize('Unidentified'),
                        type: 'label',
                        font: 'bold'
                    },{}
                ],[
                    { 
                        id: `inventoryMode${type}.selection.filter.identified`,
                        type: "checkbox",
                        sync,
                        default: true
                    },{ 
                        id: `inventoryMode${type}.selection.filter.unidentified`,
                        type: "checkbox",
                        sync,
                        default: true
                    },{}
                ]
            ]
        }]
    },

    getSettings: function() {
        return [
            ...inventoryMode.getSelectionSettings(),
            {
                label: localize('SyncTypeAndFilter'),
                id: 'inventoryMode.syncFilter',
                type: 'checkbox',
                link: getDocs('#synced-settings'),
                indent: true,
                visibility: { 
                    hideOn: [ 
                        { [`inventoryMode.mode`]: "offset" },
                        { [`inventoryMode.mode`]: "setSyncFilter" } 
                    ] 
                },
            },{
                id: `inventoryMode-item-wrapper`,
                type: "wrapper",
                visibility: { 
                    hideOn: [ 
                        { [`inventoryMode.mode`]: "offset" },
                        { [`inventoryMode.mode`]: "setSyncFilter" } 
                    ] 
                },
                settings:
                [
                    {
                        label: localize('Selection', 'MD'),
                        id: "inventoryMode.selection.mode",
                        type: "select",
                        default: "nr",
                        options: [
                            {value:'nr', label: localize('SelectByNr', 'MD')},
                            {value:'nameId', label: localize('SelectByName/Id', 'MD')}
                        ]
                    },{
                        label: localize("Order"),
                        id: "inventoryMode.selection.order",
                        type: "select",
                        indent: true,
                        options: [
                            {value:'order', label: localize('CharacterSheet')},
                            {value:'name', label: localize('Alphabetically')}
                        ],
                        visibility: { showOn: [ { ["inventoryMode.selection.mode"]: "nr" } ] }
                    },{
                        label: localize("Nr", "MD"),
                        id: "inventoryMode.selection.nr",
                        type: "number",
                        default: "1",
                        indent: true,
                        visibility: { showOn: [ { ['inventoryMode.selection.mode']: "nr" } ] }
                    },{
                        label: localize("Name/Id", "MD"),
                        id: "inventoryMode.selection.nameId",
                        type: "textbox",
                        indent: true,
                        visibility: { showOn: [ { ['inventoryMode.selection.mode']: "nameId" } ] }
                    },{
                        type: "line-right"
                    },
                    ...getItemOnPressSettings(),{
                        type: "line-right"
                    },
                    ...getItemOnPressSettings('hold'),
                    {
                        type: "line-right"
                    },{
                        label: localize("Display", "MD"),
                        id: "inventoryMode-display-table",
                        type: "table",
                        columnVisibility: [
                            true,
                            true,
                            true
                        ],
                        columns: 
                        [
                            { label: localize("Icon", "MD") },
                            { label: localize("Name", "ALL") },
                            { label: localize("Box", "MD") }
                        ],
                        rows: 
                        [
                            [
                                {
                                    id: "display.inventoryMode.icon",
                                    type: "checkbox",
                                    default: true
                                },{
                                    id: "display.inventoryMode.name",
                                    type: "checkbox",
                                    default: true
                                },{
                                    id: "display.inventoryMode.box",
                                    type: "select",
                                    default: "none",
                                    options: [
                                        { value: 'none', label: localize('None', "ALL") },
                                        { value: 'quantity', label: localize('Items.Description.Quantity', 'SFRPG') },
                                        { value: 'capacity', label: localize('Items.Capacity.Capacity', 'SFRPG') }
                                    ]
                                }
                            ]
                        ]
                    }
                ]
            },{
                id: `inventoryMode-offset-wrapper`,
                type: "wrapper",
                visibility: { showOn: [ { [`inventoryMode.mode`]: "offset" } ] },
                settings:
                [
                    {
                        type: "line-right"
                    },{
                        label: localize("Offset", "MD"),
                        id: "inventoryMode.offset.mode",
                        type: "select",
                        link: getDocs('#offset'),
                        options: [
                            { value: "set", label: localize("SetToValue", "MD") },
                            { value: "increment", label: localize("IncreaseDecrease", "MD") }
                        ]
                    },{
                        label: localize("Value", "SFRPG"),
                        id: "inventoryMode.offset.value",
                        type: "number",
                        step: "1",
                        default: "0",
                        indent: true
                    },{
                        type: "line-right"
                    },{
                        label: localize("Display", "MD"),
                        id: "inventoryMode-offset-display-table",
                        type: "table",
                        columns: 
                        [
                            { label: localize("Icon", "MD") },
                            { label: localize("Offset", "MD") }
                        ],
                        rows: 
                        [
                            [
                                {
                                    id: "display.inventoryMode.offsetIcon",
                                    type: "checkbox",
                                    default: true
                                },{
                                    id: "display.inventoryMode.offset",
                                    type: "checkbox",
                                    default: true
                                }
                            ]
                        ]
                    }
                ]
            },{
                id: `inventoryMode-setSync-wrapper`,
                type: "wrapper",
                indent: "true",
                visibility: { showOn: [ { [`inventoryMode.mode`]: "setSyncFilter" } ] },
                settings: [
                    ...inventoryMode.getSelectionSettings('.setSync', undefined),
                    {
                        label: localize("Display", "MD"),
                        id: "inventoryMode-setSync-display-table",
                        type: "table",
                        columns: 
                        [
                            { label: localize("Name", "ALL") }
                        ],
                        rows: 
                        [
                            [
                                {
                                    id: "display.inventoryMode.setSync.name",
                                    type: "checkbox",
                                    default: true
                                }
                            ]
                        ]
                    }
                ]
            }
        ]
    }
}

function getItemTypes() {
    return [
        {value: 'any', label: Helpers.localize('Any', 'MD') },
        {value: 'weapon', label: Helpers.localize('Items.Categories.Weapons', 'SFRPG') },
        {value: 'shield', label: Helpers.localize('Items.Categories.Shields', 'SFRPG')},
        {value: 'armor', label: Helpers.localize('Items.Categories.Armor', 'SFRPG')},
        {value: 'ammunition', label: Helpers.localize('Items.Categories.Ammunition', 'SFRPG') },
        {value: 'consumable', label: Helpers.localize('Items.Categories.Consumables', 'SFRPG') },
        {value: 'goods', label: Helpers.localize('Items.Categories.Goods', 'SFRPG') },
        {value: 'container', label: Helpers.localize('Items.Categories.Containers', 'SFRPG') },
        {value: 'technological', label: Helpers.localize('ActorSheet.Inventory.Interface.SpecialItems', 'SFRPG') },
        {value: 'upgrade', label: Helpers.localize('ActorSheet.Inventory.Interface.EquipmentEnhancements', 'SFRPG') },
        {value: 'augmentation', label: Helpers.localize('Items.Categories.Augmentations', 'SFRPG') }
    ]
}

function getItem(actor, settings) {
    let items = actor.items.filter(i => i.type !== 'feat' && i.system.type !== 'spell');

    //Filter items
    const filter = settings.selection.filter;
    if (filter.equipped && filter.unequipped && !filter.unequippable) items = items.filter(i => i.system.equippable || i.system.isEquipment);
    else if (filter.equipped && !filter.unequipped && filter.unequippable) items = items.filter(i => i.system.equipped || (!i.system.equippable && !i.system.isEquipment));
    else if (!filter.equipped && filter.unequipped && filter.unequippable) items = items.filter(i => !i.system.equipped);
    else if (filter.equipped && !filter.unequipped && !filter.unequippable) items = items.filter(i => i.system.equipped);
    else if (!filter.equipped && filter.unequipped && !filter.unequippable) items = items.filter(i => (i.system.equippable || i.system.isEquipment) && i.system.equipped === false);
    else if (!filter.equipped && !filter.unequipped && filter.unequippable) items = items.filter(i => !i.system.equippable && !i.system.isEquipment);

    if (filter.identified && !filter.unidentified) items = items.filter(i => i.system.identified);
    else if (!filter.identified && filter.unidentified) items = items.filter(i => i.system.identified === false);
    else if (!filter.identified && !filter.unidentified) items = items.filter(i => i.system.identified === undefined);

    if (settings.mode === 'any') {}
    else if (settings.mode === 'armor')
        items = items.filter(i => i.type === 'equipment' && i.system.armor);
    else
        items = items.filter(i => i.type === settings.mode);

    if (settings.selection.order === 'order') {
        let ordered = [];
        for (let itemType of Object.values(getItemTypes())) {
            let i = (itemType.value === 'armor') ? items.filter(i => i.type === 'equipment' && i.system.armor) : items.filter(i => i.type === itemType.value);
            if (i.length === 0) continue;
            i = game.materialDeck.Helpers.sort(i, 'order');
            ordered.push(...i);
        }
        items = ordered;
    }
    else
        items = game.materialDeck.Helpers.sort(items, settings.selection.order);

    if (!items || items.length === 0) return;

    let item;
    if (settings.selection.mode === 'nr') {
        let itemNr = parseInt(settings.selection.nr) - 1 + inventoryOffset;
        item = items[itemNr];
    }
    else if (settings.selection.mode === 'nameId') {
        item = items.find(i => i.id === settings.selection.nameId.split('.').pop());
        if (!item) item = items.find(i => i.name === settings.selection.nameId);
        if (!item) item = items.find(i => game.materialDeck.Helpers.stringIncludes(i.name, settings.selection.nameId));
    }
    return item;
}

function getItemOnPressSettings(type='keyUp') {
    return [
        {
            label: localize(type=='keyUp' ? 'OnPress' : 'OnHold', 'MD'),
            id: `inventoryMode.${type}.mode`,
            type: "select",
            link: getDocs("#use-item"),
            options: [
                { value: 'doNothing', label: localize('DoNothing', 'MD') },
                { value: 'useItem', label: localize('Items.Consumable.UseAction', 'SFRPG') },
                { value: 'equip', label: localize('Equip') }
            ]
        },{
            id: `inventoryMode-${type}-useItem-wrapper`,
            type: "wrapper",
            indent: true,
            visibility: { showOn: [ { [`inventoryMode.${type}.mode`]: "useItem" } ] },
            settings:
            [
                {
                    label: localize('RollMode'),
                    id: `inventoryMode.${type}.itemRollMode`,
                    type: "select",
                    default: "default",
                    options: [
                        {value:'default', label: localize('Default', 'ALL')},
                        ...Helpers.getItemRollModes()
                    ]
                }
            ]
        },{
            label: localize("Mode", "MD"),
            id: `inventoryMode.${type}.equip.mode`,
            type: "select",
            indent: true,
            visibility: { showOn: [ { [`inventoryMode.${type}.mode`]: "equip" } ] },
            options: [
                { value: 'toggle', label: localize('Toggle', 'MD') },
                { value: 'equip', label: localize('Equip') },
                { value: 'unequip', label: localize('Unequip') }
            ]
        }
    ]
}