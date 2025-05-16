import { Helpers } from "../../helpers.js";
import { getSpellTypes } from "./spellbookMode.js";

const localize = Helpers.localize;

function getDocs(path, action="token") {
    return Helpers.getDocumentationUrl(path, action);
}

export const tokenMode = {

    getActions: function(settings) {
        let actions = { update: [], keyDown: [], keyUp: [], hold: [] };

        const stats = settings.tokenMode.stats.mode;
        
        if (stats === "HP" || stats === "TempHP") {
            actions.update.push({
                run: this.onUpdateHP,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        if (stats === "Stamina") {
            actions.update.push({
                run: this.onUpdateStamina,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "EnergyAC" || stats === "KineticAC") {
            actions.update.push({
                run: this.onUpdateAC,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Speed") {
            actions.update.push({
                run: this.onUpdateSpeed,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Init") {
            actions.update.push({
                run: this.onUpdateInitiative,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Spellcasting") {
            actions.update.push({
                run: this.onUpdateSpellcasting,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Currency") {
            actions.update.push({
                run: this.onUpdateCurrency,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "XP") {
            actions.update.push({
                run: this.onUpdateXP,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Ability" || stats === "AbilityMod") {
            actions.update.push({
                run: this.onUpdateAbility,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "Save") {
            actions.update.push({
                run: this.onUpdateSave,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }
        else if (stats === "SkillRank" || stats === "SkillMod") {
            actions.update.push({
                run: this.onUpdateSkill,
                on: ['updateActor', 'createToken', 'deleteToken'],
                source: 'stats'
            });
        }

        const onPress = settings.tokenMode.keyUp?.mode;
        const onHold = settings.tokenMode.hold?.mode;
        const holdTime = game.materialDeck.holdTime;

        if (onPress === 'condition') {
            actions.update.push({
                run: this.onUpdateConditions,
                on: ['applyTokenStatusEffect'],
                source: 'onPress'
            });
            actions.keyUp.push({
                run: this.onKeydownConditions,
                source: 'onPress',
                stopOnHold: true
            });
        }
        else if (onPress === 'roll') {
            actions.keyUp.push({
                run: this.onKeydownRoll,
                source: 'onPress',
                stopOnHold: true
            });
        }

        if (onHold === 'condition') {
            actions.hold.push({
                run: this.onKeydownConditions,
                delay: holdTime,
                source: 'onPress'
            });
        }
        else if (onHold === 'roll') {
            actions.hold.push({
                run: this.onKeydownRoll,
                delay: holdTime,
                source: 'onPress'
            });
        }

        return actions;
    },

    /****************************************************************
     * Stats
     ****************************************************************/
    onUpdateHP: function(data) {
        const settings = data.settings.tokenMode.stats;

        let text = "";
        let hp = {value: 0, temp: 0, max: 0};
      
        if (data.actor) {
            hp = data.actor.system.attributes.hp;
            if (settings.mode === "HP" && settings.hp.mode === 'nr') 
                text = hp.value + "/" + hp.max;
            else if (settings.mode === "TempHP")
                text = hp.temp !== null ? hp.temp : 0;
        }
        
        return {
            text, 
            icon: settings.mode === 'HP' && data.settings.display.icon === 'stats' ? Helpers.getImage("hp_empty.png") : "", 
            options: {
                uses: {
                    available: settings.mode !== "TempHP" ? hp.value : hp.temp,
                    maximum: settings.mode !== "TempHP" ? hp.max : undefined,
                    heart: (settings.mode === 'HP' && data.settings.display.icon === 'stats') ? "#FF0000" : undefined,
                    box: settings.hp.mode === 'box',
                    bar: settings.hp.mode === 'bar'
                }
            }
        };
    },

    onUpdateStamina: function(data) {
        const settings = data.settings.tokenMode.stats;

        let text = "";
        let stamina = {value: 0, temp: 0, max: 0};
      
        if (data.actor) {
            stamina = data.actor.system.attributes.sp;
            text = stamina.value + "/" + stamina.max;
        }
        
        return {
            text: settings.hp.mode === 'nr' ? text : undefined, 
            icon: "", 
            options: {
                uses: {
                    available: stamina.value,
                    maximum: stamina.max,
                    box: settings.hp.mode === 'box',
                    bar: settings.hp.mode === 'bar'
                }
            }
        };
    },

    onUpdateAC: function(data) {
        const settings = data.settings.tokenMode.stats;
        let ac = {value: 0, temp: 0, max: 0};
        let text = '';
        if (data.actor) {
            ac = settings.mode === 'EnergyAC' ? data.actor.system.attributes.eac : data.actor.system.attributes.kac;
            text = ac.value;
        }
        return {
            text: text, 
            icon: data.settings.display.icon == 'stats' ? 'icons/equipment/shield/heater-steel-worn.webp' : ''
        }
    },

    onUpdateSpeed: function(data) {
        let text = "";

        if (data.actor) {
            const movement = data.actor.system.attributes.speed;

            if (movement.burrowing.value > 0) text += `${localize("ActorSheet.Attributes.Speed.Types.Burrowing", "SFRPG")}: ${movement.burrowing.value}`;
            if (movement.climbing.value > 0) {
                if (text.length > 0) text += '\n';
                text += `${localize("ActorSheet.Attributes.Speed.Types.Climbing", "SFRPG")}: ${movement.climbing.value}`;
            }
            if (movement.flying.value > 0) {
                if (text.length > 0) text += '\n';
                text += `${localize("ActorSheet.Attributes.Speed.Types.Flying", "SFRPG")}: ${movement.flying.value}`;
            }
            if (movement.swimming.value > 0) {
                if (text.length > 0) text += '\n';
                text += `${localize("ActorSheet.Attributes.Speed.Types.Swimming", "SFRPG")}: ${movement.swimming.value}`;
            }
            if (movement.land.value > 0) {
                if (text.length > 0) text += '\n';
                text += `${localize("ActorSheet.Attributes.Speed.Types.Land", "SFRPG")}: ${movement.land.value}`;
            }
        }
        
        return{
            text, 
            icon: data.settings.display.icon === 'stats' ? 'icons/equipment/feet/shoes-collared-leather-blue.webp' : ""
        };
    },

    onUpdateInitiative: function(data) {
        const init = data.actor?.system.attributes.init.total;
        return{
            text: data.actor ? (init >= 0 ? "+" : "") + init : '', 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage("d20.png") : '',
            options: { dim: data.settings.display.icon === 'stats' }
        };
    },

    onUpdateSpellcasting: function(data) {
        const settings = data.settings.tokenMode.stats.spellcasting;
        const spellbook = data.actor?.system?.attributes?.spellcasting;
        let text = '';

        if (spellbook) {
            if (settings.mode === 'ability') {
                const ability = data.actor?.system?.attributes?.spellcasting;
                text = CONFIG.SFRPG.abilities[ability];
            }
            else if (settings.mode === 'spellSlots') {
                const slots = data.actor?.system?.spells[settings.slots];
                const max = isNaN(slots.max) ? 0 : slots.max;
                text = `${slots.value}/${max}`
            }
        }
        
        return {
            text,
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage("spellbook.png") : '',
            options: { dim: data.settings.display.icon == 'stats' }
        } 
    },

    onUpdateCurrency: function(data) {
        const currencyType = data.settings.tokenMode.stats.currency;
        let text = '';
        const currency = data.actor?.system?.currency;
        if (currency) {
            if (currencyType === 'all') {
                for (let [key, value] of Object.entries(CONFIG.SFRPG.currencies)) {
                    if (currency[key] && currency[key] !== 0) {
                        if (text !== '') text += ', ';
                        text += `${currency[key]} ${value}`
                    }
                }  
            } 
            else 
                text = `${currency[currencyType] || 0} ${CONFIG.SFRPG.currencies[currencyType]}`
        }
        
        return {
            text, 
            icon: data.settings.display.icon === 'stats' ? 'fas fa-coins' : ''
        }
    },

    onUpdateXP: function(data) {
        const settings = data.settings.tokenMode.stats;
        let text = '';
        const xp = data.actor?.system?.details?.xp;
        let available = 0;
        let maximum = 0;
        if (xp) {
            available = xp.value;
            maximum = xp.max;
            if (settings.hp.mode === 'nr') {
                text = maximum ? `${available}/${maximum}` : available;
            }
            if (!maximum) maximum = available;
        }
        
        return {
            text, 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage('progression.png') : '',
            options: { 
                dim: data.settings.display.icon == 'stats',
                uses: {
                    available,
                    maximum,
                    box: settings.hp.mode === 'box',
                    bar: settings.hp.mode === 'bar'
                }
            }
        }
    },

    onUpdateAbility: function(data) {
        const statsMode = data.settings.tokenMode.stats.mode;
        const ability = data.settings.tokenMode.stats.ability;

        let text = "";
        
        if (data.actor) {
            if (statsMode == "Ability")
                text += data.actor.system.abilities?.[ability].value;
            else if (statsMode == "AbilityMod") {
                const mod = data.actor.system.abilities?.[ability].mod;
                text += (mod >= 0 ? "+" : "") + mod;
            }
            else if (statsMode == "Save") {
                const save = data.actor.system.abilities?.[ability].save.value;
                text += (save >= 0 ? "+" : "") + save;
            }  
        }
        
        return {
            text, 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage(`abilities/${ability == 'con' ? 'cons' : ability}.png`) : '', 
            options: { dim: data.settings.display.icon == 'stats' }
        };
    },

    onUpdateSave: function(data) {
        const save = data.settings.tokenMode.stats.save;
        let text = "";

        if (data.actor) {
            const val = data.actor.system.attributes[save]?.bonus;
            text = (val >= 0) ? `+${val}` : val;
        }
        
        return {
            text, 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage(`saves/${save}.png`) : '', 
            options: { dim: data.settings.display.icon == 'stats' }
        };
    },

    onUpdateSkill: function(data) {
        const statsMode = data.settings.tokenMode.stats.mode;
        const settings = data.settings.tokenMode.stats;
        let text = "";

        if (data.actor) {
            let skill;
            if (statsMode === "SkillRank") {
                skill = data.actor.system.skills?.[settings.skill].ranks;
                text += (skill >= 0 ? "+" : "") + skill;
            }
            else if (statsMode == "SkillMod")
                text += data.actor.system.skills?.[settings.skill].mod;
        }
        
        return {
            text, 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage(`skills/${settings.skill}.png`) : '', 
            options: { dim: data.settings.display.icon == 'stats' }
        };
    },

    onUpdateProficiency: function(data) {
        const prof = data.actor?.system?.attributes?.prof;
        return {
            text: prof ? (prof >= 0 ? "+" : "") + prof : '', 
            icon: data.settings.display.icon == 'stats' ? Helpers.getImage("progression.png") : '', 
            options: { dim: data.settings.display.icon == 'stats' }
        };
    },

    /****************************************************************
     * On Press
     ****************************************************************/

    onUpdateConditions: function(data) {
        const settings = data.settings.tokenMode.keyUp.condition;
        if ((data.hook === 'createActiveEffect' || data.hook === 'deleteActiveEffect') && data.args[0].parent.id !== data.actor.id) return 'doNothing';

        const conditionActive = data.actor ? getConditionActive(data.actor, settings.condition) : false;
        const displayIcon = data.settings.display.icon === 'onPress';

        return {
            icon: displayIcon ? getConditionIcon(settings.condition) : '', 
            options: { 
                dim: displayIcon,
                border: true,
                borderColor: conditionActive ? data.settings.colors.on : data.settings.colors.system.off
            }
        };
    },

    onKeydownConditions: async function(data) {
        const settings = data.settings.tokenMode[data.actionType].condition;

        if (settings.condition === 'removeAll')
            for (let [condition, value] of Object.entries(data.actor.system.conditions)) {
                if (value) data.actor.setCondition(condition, false);
            }
        else
            data.actor.setCondition(settings.condition, !data.actor.system.conditions[settings.condition]);
    },

    onKeydownRoll: function(data) {
        const settings = data.settings.tokenMode[data.actionType].roll;

        if (settings.mode === 'initiative') data.actor.rollInitiative({rerollInitiative: true});
        else if (settings.mode === 'ability') data.actor.rollAbility(settings.ability);
        else if (settings.mode === 'save') data.actor.rollSave(settings.save);
        else if (settings.mode === 'skill') data.actor.rollSkill(settings.skill);
    },

    /****************************************************************
     * Get settings
     ****************************************************************/

    getSettings: function() {
        return [
            ...getTokenStats('pageWide.stats'),
            ...getTokenOnPress('keyUp', 'pageWide.keyUp'),
            ...getTokenOnPress('hold', 'pageWide.hold'),
        ]
    }
}

export function getTokenStats(sync) {
    return [
        {
            id: "tokenMode.stats.mode",
            appendOptions: [
                { value: 'HP', label: localize('ActorSheet.Modifiers.EffectTypes.HP', 'SFRPG') },
                { value: 'TempHP', label: localize('TempHP') },
                { value: 'Stamina', label: localize('Stamina', 'SFRPG') },
                { value: 'EnergyAC', label: localize('EnergyArmorClass', 'SFRPG') },
                { value: 'KineticAC', label: localize('KineticArmorClass', 'SFRPG') },
                { value: 'Speed', label: localize('ActorSheet.Attributes.Speed.MovementSpeedTitle', 'SFRPG') },
                { value: 'Init', label: localize('InitiativeLabel', 'SFRPG') },
                { value: 'Spellcasting', label: localize('ItemSheet.Class.SpellCasting.Header', 'SFRPG') },
                { value: 'Currency', label: localize('InventoryCurrency', 'SFRPG') },
                { value: 'Ability', label: localize('ModifierTypeAbility', 'SFRPG') },
                { value: 'AbilityMod', label: localize('Items.Action.AbilityModifier', 'SFRPG') },
                { value: 'Save', label: localize('Save', 'SFRPG') },
                { value: 'SkillRank', label: localize('ActorSheet.Attributes.Skills.SkillRanks', 'SFRPG') },
                { value: 'SkillMod', label: `${localize('SkillModifier')}` },
                { value: 'XP', label: localize('Combat.Difficulty.Units.XP', 'SFRPG') }
            ]
        },{
            id: "sfrpg-tokenMode-stats-wrapper",
            type: "wrapper",
            after: "tokenMode.stats.mode",
            indent: true,
            settings: [
                {
                    label: localize('Mode', 'MD'),
                    id: "tokenMode.stats.hp.mode",
                    type: "select",
                    default: "nr",
                    sync,
                    options: [
                        {value:'nr', label: localize('Number', 'MD') },
                        {value:'box', label: `${localize('Box', 'MD')}` },
                        {value:'bar', label: `${localize('Bar', 'MD')}` }
                    ],
                    visibility: { showOn: [ 
                        { ["tokenMode.stats.mode"]: "HP" },
                        { ["tokenMode.stats.mode"]: "XP" },
                        { ["tokenMode.stats.mode"]: "Stamina" }
                    ] }
                },{
                    id: "sfrpg-tokenMode-stats-spellCasting-wrapper",
                    type: "wrapper",
                    after: "stats",
                    visibility: { showOn: [ { ["tokenMode.stats.mode"]: "Spellcasting" } ] },
                    settings: [
                        {
                            label: localize('Mode', 'MD'),
                            id: "tokenMode.stats.spellcasting.mode",
                            type: "select",
                            sync,
                            default: "ability",
                            options: [
                                { value: 'ability', label: localize('SpellBook.SpellCastingAbility', 'SFRPG') },
                                { value: 'spellSlots', label: localize('SpellSlots')}
                            ]
                        },{
                            label: localize('LevelLabelText', 'SFRPG'),
                            id: "tokenMode.stats.spellcasting.slots",
                            type: "select",
                            sync,
                            default: "spell1",
                            indent: true,
                            visibility: { showOn: [ { ["tokenMode.stats.spellcasting.mode"]: "spellSlots" } ] },
                            options: getSpellTypes()
                        }
                    ]
                },{
                    label: localize('Type', 'ALL'),
                    id: "tokenMode.stats.currency",
                    type: "select",
                    sync,
                    default: "all",
                    visibility: { showOn: [ { ["tokenMode.stats.mode"]: "Currency" } ] },
                    options: getCurrencyTypes()
                },{
                    label: localize('ModifierTypeAbility', 'SFRPG'),
                    id: "tokenMode.stats.ability",
                    type: "select",
                    sync,
                    default: "str",
                    visibility: {
                        showOn: [
                            { ["tokenMode.stats.mode"]: "Ability" },
                            { ["tokenMode.stats.mode"]: "AbilityMod" }
                        ]
                    },
                    options: getAbilityList()
                },{
                    label: localize('Save', 'SFRPG'),
                    id: "tokenMode.stats.save",
                    type: "select",
                    visibility: {
                        showOn: [
                            { ["tokenMode.stats.mode"]: "Save" }
                        ]
                    },
                    options: getSavesList()
                },{
                    label: localize('Skill', 'SFRPG'),
                    id: "tokenMode.stats.skill",
                    type: "select",
                    sync,
                    visibility: { showOn: [ { ["tokenMode.stats.mode"]: "SkillRank" }, { ["tokenMode.stats.mode"]: "SkillMod" } ] },
                    options: getSkillList()
                }
            ]
        }
    ]
}

function getTokenOnPress(mode='keyUp', sync) {
    return [
        {
            id: `tokenMode.${mode}.mode`,
            appendOptions: [
                { value: 'condition', label: localize('ToggleCondition') },
                { value: 'roll', label: localize('DiceRoll') }
            ]
        },{
            id: `5e-${mode}-wrapper`,
            type: "wrapper",
            after: `tokenMode.${mode}.mode`,
            indent: true,
            settings: [
                {
                    label: localize('Condition'),
                    id: `tokenMode.${mode}.condition.condition`,
                    type: "select",
                    sync,
                    indent: true,
                    link: getDocs('#token-mode'),
                    visibility: { showOn: [ { [`tokenMode.${mode}.mode`]: "condition" } ] },
                    options: [
                        { value: "removeAll", label: localize("RemoveAll") },
                        { label: localize("Condition"), children: getConditionList() }
                    ]
                },{
                    id: `sfrpg-${mode}-roll-wrapper`,
                    type: "wrapper",
                    visibility: { showOn: [ {[`tokenMode.${mode}.mode`]: "roll"} ] },
                    settings: [
                        {
                            label: "Roll",
                            id: `tokenMode.${mode}.roll.mode`,
                            type: "select",
                            sync,
                            link: getDocs('#dice-roll'),
                            options: [
                                {value:'initiative', label: localize('InitiativeLabel', 'SFRPG')},
                                {value:'ability', label: localize('ModifierTypeAbility', 'SFRPG')},
                                {value:'save', label: localize('Save', 'SFRPG')},
                                {value:'skill', label: localize('ActionSkill', 'SFRPG')}
                            ]
                        },{
                            label: localize('ModifierTypeAbility', 'SFRPG'),
                            id: `tokenMode.${mode}.roll.ability`,
                            type: "select",
                            sync,
                            indent: true,
                            visibility: { showOn: [ { [`tokenMode.${mode}.roll.mode`]: "ability" } ] },
                            options: getAbilityList()
                        },{
                            label: localize('Save', 'SFRPG'),
                            id: `tokenMode.${mode}.roll.save`,
                            type: "select",
                            indent: true,
                            visibility: { showOn: [ { [`tokenMode.${mode}.roll.mode`]: "save" } ] },
                            options: getSavesList()
                        },{
                            label: localize('Items.Theme.Skill', 'SFRPG'),
                            id: `tokenMode.${mode}.roll.skill`,
                            type: "select",
                            sync,
                            indent: true,
                            visibility: { showOn: [ { [`tokenMode.${mode}.roll.mode`]: "skill" } ] },
                            options: getSkillList()
                        }
                    ]
                }
            ]
        }
    ]
}

function getConditionIcon(condition) {
    if (condition == 'removeAll') 
        return window.CONFIG.controlIcons.effects;
    return CONFIG.statusEffects.find(e => e.id === condition).img;
}

function getConditionActive(actor, condition) {
    if (condition === 'removeAll') { 
        for (let value of Object.values(actor.system.conditions))
            if (value) return true;
        return false;
    }
    else
        return actor.system.conditions[condition];
}

function getCurrencyTypes() {
    let currencies = [{ value: 'all', label: localize('All', 'MD')}]
    for (let [key, value] of Object.entries(CONFIG.SFRPG.currencies)) {
        currencies.push({
            value: key,
            label: value
        })
    }
    return currencies;
}

function getAbilityList() {
    let abilities = [];
    for (let [key, value] of Object.entries(CONFIG.SFRPG.abilities)) 
        abilities.push({
            value: key, 
            label: value
        })
    return abilities;
}

function getSavesList() {
    let abilities = [];
    for (let [key, value] of Object.entries(CONFIG.SFRPG.saves)) 
        abilities.push({
            value: key, 
            label: value
        })
    return abilities;
}

function getSkillList() {
    let skills = [];
    for (let [key, value] of Object.entries(CONFIG.SFRPG.skills)) 
        skills.push({
            value: key, 
            label: value
        })
    return skills;
}

function getConditionList() {
    let conditions = [];
    for (let c of CONFIG.statusEffects) 
        conditions.push({
            value: c.id, 
            label: localize(c.name, 'ALL')
        });
    return conditions;
}