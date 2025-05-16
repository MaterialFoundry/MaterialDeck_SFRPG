import { documentation } from "./materialdeck-sfrpg.js"

export class Helpers {

    static getDocumentationUrl(path, action) {
        let url = `${documentation}/actions/${action}/${path}`;
        return url;
    }
    
    static localize(str, category='', formatData) {
        if (category === '') return game.i18n.format(`MATERIALDECK_SFRPG.${str}`, formatData);
        else if (category === 'ALL') return game.i18n.format(str, formatData);
        else if (category === 'MD') return game.i18n.format(`MATERIALDECK.${str}`, formatData);
        else if (category === 'SFRPG') return game.i18n.format(`SFRPG.${str}`, formatData);
        return game.i18n.format(`MATERIALDECK_SFRPG.${category}.${str}`, formatData);
    }

    static getImage(name, path=`modules/materialdeck-sfrpg/img/`) {
        return path + name;
    }

    static rollItem(item, settings) {
        const itemRollMode = settings.itemRollMode === 'default' ? Helpers.itemRollMode.get(true) : settings.itemRollMode;

        if (item.hasAttack && itemRollMode === 'attack') 
            item.rollAttack();
        else if (item.hasDamage && itemRollMode === 'damage')
            item.rollDamage();
        else if (item.type === 'spell' && itemRollMode === 'use')
            item.useSpell();
        else if (item.type === 'consumable' && itemRollMode === 'use')
            item.rollConsumable();
        else if (item.type === 'feat' && item.isFeat && itemRollMode === 'use')
            item.setActive(!item.system.isActive);
        else
            item.roll(); 
    }

    /**
     * Item Roll Mode
     */

    static itemRollMode; 

    static getItemRollModes() {
        return [
            { value: 'description', label: Helpers.localize('Description', 'ALL')},
            { value: 'use', label: Helpers.localize('Use/Cast')},
            { value: 'attack', label: Helpers.localize('Attack', 'SFRPG')},
            { value: 'damage', label: Helpers.localize('Damage.Title', 'SFRPG')}
        ]
    }

    static getItemRollModeIcons(type) {
        if (type === 'default') return 'fas fa-grip-lines';
        else if (type === 'description') return 'fas fa-file-lines';
        else if (type === 'use') return 'fas fa-flask';
        else if (type === 'attack') return 'fas fa-mace';
        else if (type === 'damage') return 'fas fa-face-head-bandage';
    }
}

const localize = Helpers.localize;