import EasyStar from "easystarjs";

import tilemapPng from '../../assets/tileset/Dungeon_Tileset.png'
import gunPng from '../../assets/sprites/gun.png'
import bulletPng from '../../assets/sprites/bullet.png'
import cursorCur from '../../assets/sprites/cursor.cur'

import dungeonRoomJson from '../../assets/dungeon_room.json'
import CharacterFactory from "../../src/characters/character_factory";
import EffectsFactory from "../../src/utils/effects-factory";

import UserControlled from '../../src/ai/behaviour/user_controlled'

import Vector2 from 'phaser/src/math/Vector2'
import auroraSpriteSheet from "../../assets/sprites/characters/aurora.png";
import blueSpriteSheet from "../../assets/sprites/characters/blue.png";
import greenSpriteSheet from "../../assets/sprites/characters/green.png";
import yellowSpriteSheet from "../../assets/sprites/characters/yellow.png";
import punkSpriteSheet from "../../assets/sprites/characters/punk.png";
import slimeSpriteSheet from "../../assets/sprites/characters/slime.png";
import Footsteps from "../../assets/audio/footstep_ice_crunchy_run_01.wav";

export class PlayerWithGun extends Phaser.GameObjects.Container {
    constructor(scene, x, y, characterSpriteName, gunSpriteName) {
        super(scene, x, y)
        this.setSize(31, 31);
        scene.physics.world.enable(this);
        this.body.setCollideWorldBounds(true);
        scene.add.existing(this);

        this.character = scene.characterFactory.buildCharacter('aurora', 0, 0, {player: true});
        this.gun = new Phaser.GameObjects.Sprite(scene, 2, 8, gunSpriteName);

        this.add(this.character)
        this.add(this.gun)

        this.setViewDirectionAngle(0)

        this.behaviuors = [];
        this.steerings = [];
        this.hp = 100;
        this.radius = 100;
        this.groupId = 0;

        scene.input.on('pointermove', pointer => this._onPointerMove(pointer));
    }

    _onPointerMove(pointer) {
        this.setViewDirectionAngle(
            Phaser.Math.Angle.Between(
                this.x + this.gun.x,
                this.y + this.gun.y,
                pointer.x,
                pointer.y
            )
        )
    }

    addBehaviour(behaviour) {
        behaviour.character = this;
        this.behaviuors.push(behaviour);
    }

    update() {
        this.behaviuors.forEach(x => x.update());
        this.updateAnimation();
    };

    get bulletStartingPoint() {
        const angle = this.viewDirectionAngle
        const approxGunWidth = this.gun.width - 2
        const x = this.gun.x + (approxGunWidth * Math.cos(angle));
        const y = this.gun.y + (approxGunWidth * Math.sin(angle));
        return new Vector2(this.x + x, this.y + y)
    }

    setViewDirectionAngle(newAngle) {
        this.viewDirectionAngle = newAngle

        if(newAngle > 1.56 || newAngle < -1.56) {
            this.gun.setFlip(false, true)
            this.gun.setOrigin(0.4, 0.6)
            this.gun.x = -6
        } else {
            this.gun.setFlip(false, false)
            this.gun.setOrigin(0.4, 0.4)
            this.gun.x = 6
        }
        this.gun.setRotation(newAngle)
    }

    updateAnimation() {
        try {
            const animations = this.animationSets.get('WalkWithGun');
            const animsController = this.character.anims;
            const angle = this.viewDirectionAngle

            if (angle < 0.78 && angle > -0.78) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[1], true);
            } else if (angle < 2.35 && angle > 0.78) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[3], true);
            } else if (angle < -2.35 || angle > 2.35) {
                this.gun.y = 8
                this.bringToTop(this.gun)
                animsController.play(animations[0], true);
            } else if (angle > -2.35 && angle < -0.78) {
                this.gun.y = -4
                this.bringToTop(this.character)
                animsController.play(animations[2], true);
            } else {
                const currentAnimation = animsController.currentAnim;
                if (currentAnimation) {
                    const frame = currentAnimation.getLastFrame();
                    this.character.setTexture(frame.textureKey, frame.textureFrame);
                }
            }
        } catch (e) {
            console.error('[PlayerWithGun] updateAnimation failed')
        }
    }
}

export class Bullet extends Phaser.Physics.Arcade.Sprite
{
    constructor (scene, x, y)
    {
        super(scene, x, y, 'bullet');
    }

    fire (x, y, vx, vy)
    {
        this.body.reset(x, y);
        this.body.mass = 3;

        this.setActive(true);
        this.setVisible(true);

        this.setVelocityX(vx);
        this.setVelocityY(vy);
    }

    preUpdate (time, delta)
    {
        super.preUpdate(time, delta);
    }
}

export class Bullets extends Phaser.Physics.Arcade.Group
{
    constructor (scene)
    {
        super(scene.physics.world, scene);

        this.createMultiple({
            frameQuantity: 20,
            key: 'bullet',
            active: false,
            visible: false,
            classType: Bullet
        });
    }

    fireBullet(x, y, vx, vy)
    {
        let bullet = this.getFirstDead(false);

        if (bullet)
        {
            bullet.fire(x, y, vx, vy);
        }
    }
}