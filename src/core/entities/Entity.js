
    /**
     * @param {Number} value
     */
    addMaxHealth(value) {
        this.maxHealth += value;
        this.setMaxHealth(this.maxHealth);
    }

    /**
     * @param {Number} value
     */
    setMaxHealth(value) {
        if (value > 0) {
            this.maxHealth = value;
        }
    }

    /**
     * @param {Number} value
     */
    addHealth(value) {
        this.health += value;
        this.setHealth(this.health);
    }

    /**
     * @param {Number} value
     */
    setHealth(value) {
        if (value > 0) {
            if (value > this.maxHealth) {
                this.health = this.maxHealth;
            } else {
                this.health = value;
            }
        } else {
            this.health = 0;
            // this.kill(message, language); // TODO
        }
    }

    /**
     * TODO 2.0
     * kill a player
     * @param {*} message - The message that caused the death of the player
     */
    kill(message, language) {
        this.setEffect(":skull:");
        this.setHealth(0);
        message.channel.send(Text.entity.killPublicIntro + message.author.username + Text.entity.killPublicMessage)
        message.author.send(Text.entity.killMessage)
    }
