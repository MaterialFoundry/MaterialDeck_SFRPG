import { Helpers } from "../helpers.js";

const localize = Helpers.localize;

function getDocs(path, action="otherActions") {
    return Helpers.getDocumentationUrl(path, action);
}

export const otherAction = {

    id: 'other',

    buttonActions: function(settings) {
        let actions = { update: [], keyDown: [], keyUp: [] };
        
        if (settings.function === 'itemRollMode') {
            actions.update.push({
                run: this.onUpdateItemRollMode,
                on: ['mdUpdateItemRollMode']
            })
            actions.keyDown.push({
                run: this.onKeypressItemRollMode
            }) 
        }
        
        return actions;
    },

    onUpdateItemRollMode: function(data) {
        const mode = data.settings.itemRollMode.mode;

        return {
            text: data.settings.display.modeName ? Helpers.getItemRollModes().find(a => a.value === mode)?.label : '',
            icon: data.settings.display.icon ? Helpers.getItemRollModeIcons(mode) : "",
            options: {
                border: true,
                borderColor: Helpers.itemRollMode.get() === mode ? data.settings.colors.rollModeOn : data.settings.colors.rollModeOff,
            }
        };
    },

    onKeypressItemRollMode: function(data) {
        Helpers.itemRollMode.set(data.settings.itemRollMode.mode, data.settings.itemRollMode.reset);
    },

    settingsConfig: function() {
        return [
            {
                id: "function",
                link: "",
                appendOptions: [
                    { value: 'itemRollMode', label: localize('SetDefaultItemRollMode') },
                ]
            },{
                id: `itemRollModes-wrapper`,
                type: "wrapper",
                indent: true,
                before: "pause.mode",
                visibility: { showOn: [{ function: "itemRollMode" }]},
                settings:[
                    {
                        id: "itemRollMode.mode",
                        label: localize('Mode', 'MD'),
                        link: getDocs('#set-default-roll-mode'),
                        type: "select",
                        options: Helpers.getItemRollModes()
                        ,
                    },{
                        id: "itemRollMode.reset",
                        label: localize('SetAfterUseTo'),
                        link: "",
                        type: "select",
                        indent: true,
                        sync: "itemRollMode.pageWide",
                        options: [
                            { value: 'none', label: localize('DoNotChange') },
                            ...Helpers.getItemRollModes()
                        ]
                    },{
                        label: '',
                        id: "itemRollMode.pageWide",
                        type: "checkbox",
                        default: true,
                        visibility: false
                    }
                ]
            },{
                id: "display-table",
                prependColumnVisibility: [
                    { 
                        showOn: [ 
                            { function: "itemRollMode" }
                        ]
                    }
                ],
                prependColumns: [
                    {
                        label: localize("Name", "ALL"),
                    }
                ],
                prependRows: [
                    [
                        {
                            id: "display.modeName",
                            type: "checkbox",
                            default: true
                        }
                    ]
                ]
            },{
                id: "colors-table",
                prependColumnVisibility: [
                    { 
                        showOn: [ 
                            { function: "itemRollMode" }
                        ]
                    },{ 
                        showOn: [ 
                            { function: "itemRollMode" }
                        ]
                    }
                ],
                prependColumns: [
                    {
                        label: localize("OnColor", "MD"),
                    },{
                        label: localize("OffColor", "MD"),
                    }
                ],
                prependRows: [
                    [
                        {
                            id: "colors.rollModeOn",
                            type: "color",
                            default: "#FFFF00"
                        },{
                            id: "colors.rollModeOff",
                            type: "color",
                            default: "#000000"
                        }
                    ]
                ]
            }
        ]
    }
}