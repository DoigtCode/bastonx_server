import { v4 as uuidv4 } from 'uuid';
import { Bonus } from './bonus.js';

export class Fighter {
    constructor() {
        this.hp_max = 100;
        this.hp = this.hp_max;
        this.mana_max = 100;
        this.mana = this.mana_max;
        this.mana_regen = 2; // Mana par seconde
        this.mana_regen_i = 60;

        this.level = 1;
        this.level_price = 2;
        
        this.move_speed_max = .6;
        
        this.attack_damage = 15;
        this.attack_range = 60;
        this.attack_speed = 1; // Tirs par seconde
        this.attack_speed_i = 60;
        this.attack_prec = 50; // %
        this.attack_knockback = .1;
        this.attack_crit_chance = 3;
        
        this.bullet_speed = 1.5;
        
        this.dodge_chance = 10;
        this.dodge_cooldown = 50;
        this.dodge_cooldown_i = 0;

        this.armor = 0; // %

        this.bonus = [];

        this.id = uuidv4();
    }

    add_bonus(bonus) {
        bonus = structuredClone(bonus);
        const existing_bonus = this.bonus.find(b => b.id === bonus.id);

        if (existing_bonus) {
            existing_bonus.stock++;
            return true;
        } else if (this.bonus.length < this.level) {
            bonus.stock = 1;
            this.bonus.push(bonus);
            return true;
        }

        return false;
    }

    delete_bonus(bonus, stock_to_delete = 1) {
        const existing_bonus = this.bonus.find(b => b.id === bonus.id);
        if (existing_bonus) {
            existing_bonus.stock -= stock_to_delete;
            if (existing_bonus.stock <= 0) {
                const index = this.bonus.findIndex(b => b.id === bonus.id);
                this.bonus.splice(index, 1);
            }
        }
    }

    swap_bonus(bonus_id_1, bonus_id_2) {
        const index_1 = this.bonus.findIndex(b => b.id === bonus_id_1);
        const index_2 = this.bonus.findIndex(b => b.id === bonus_id_2);

        if (index_1 === -1 || index_2 === -1) {
            return false;
        }

        [this.bonus[index_1], this.bonus[index_2]] =
            [this.bonus[index_2], this.bonus[index_1]];

        return true;
    }

    move_bonus(bonus_id, target_index) {
        const current_index = this.bonus.findIndex(b => b.id === bonus_id);

        if (current_index === -1) {
            return false;
        }

        if (target_index < 0 || target_index >= this.bonus.length) {
            return false;
        }

        const [bonus] = this.bonus.splice(current_index, 1);
        this.bonus.splice(target_index, 0, bonus);

        return true;
    }

    stat_up(stat_name, value, is_percent) {
        if (Object.hasOwn(this, stat_name)) {
            if (is_percent) {
                this[stat_name] = this[stat_name] * (1 + (value / 100));
            } else {
                this[stat_name] = this[stat_name] + value;
            }
        }
    }
}