import React, { Component } from 'react';
import Rocket from './rocket';
import Asteroid from './asteroid';
import { randomNumBetweenExcluding } from './helpers'
import FontAwesome from 'react-fontawesome';

import {
    ShareButtons,
} from 'react-share';

const {
    FacebookShareButton,
} = ShareButtons;

const KEY = {
    LEFT:  37,
    RIGHT: 39,
    UP: 38,
    A: 65,
    D: 68,
    W: 87,
    SPACE: 32
};

var rocket_color = {
    1: 'rocket_white.png',
    2: 'rocket_red.png',
    3: 'rocket_orange.png',
    4: 'rocket_yellow.png',
    5: 'rocket_green.png',
    6: 'rocket_darkgreen.png',
    7: 'rocket_blue.png',

}


export default class App extends Component {
    constructor() {
        super();
        this.state = {
            rocket_color: 1,
            screen: {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio || 1,
            },
            context: null,
            keys : {
                left  : 0,
                right : 0,
                up    : 0,
                down  : 0,
                space : 0,
            },
            asteroidCount: 3,
            currentScore: 0,
            topScore: localStorage['topscore'] || 0,
            inGame: false,
            gameOver: false,
        }
        this.rocket = [];
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
    }

    handleResize(value, e){
        this.setState({
            screen : {
                width: window.innerWidth,
                height: window.innerHeight,
                ratio: window.devicePixelRatio || 1,
            }
        });
    }

    handleKeys(value, e){
        let keys = this.state.keys;
        if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) keys.left  = value;
        if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) keys.right = value;
        if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) keys.up    = value;
        if(e.keyCode === KEY.SPACE) keys.space = value;
        this.setState({
            keys : keys
        });
    }

    componentDidMount() {
        window.addEventListener('keyup',   this.handleKeys.bind(this, false));
        window.addEventListener('keydown', this.handleKeys.bind(this, true));
        window.addEventListener('resize',  this.handleResize.bind(this, false));

        const context = this.refs.canvas.getContext('2d');
        this.setState({ context: context });
        // this.startGame();
        requestAnimationFrame(() => {this.update()});

    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleKeys);
        window.removeEventListener('resize', this.handleKeys);
        window.removeEventListener('resize', this.handleResize);
    }

    startGame() {

        console.log('game starting');

        this.setState({
            inGame: true,
            currentScore: 0,
        });

        let rocket = new Rocket({
            position: {
                x: this.state.screen.width/2,
                y: this.state.screen.height/2
            },
            create: this.createObject.bind(this),
            color: rocket_color[this.state.rocket_color],
            onDie: this.gameOver.bind(this)
        });

        this.createObject(rocket, 'rocket');
        this.asteroids = [];
        this.generateAsteroids(this.state.asteroidCount);

    }

    gameOver(){
        this.setState({
            inGame: false,
            gameOver: true,
        });

        // Replace top score
        if(this.state.currentScore > this.state.topScore){
            this.setState({
                topScore: this.state.currentScore,
            });
            localStorage['topscore'] = this.state.currentScore;
        }
    }

    addScore(points){
        if(this.state.inGame){
            this.setState({
                currentScore: this.state.currentScore + points,
            });
        }
    }

    generateAsteroids(howMany){
        let asteroids = [];
        let rocket = this.rocket[0];
        for (let i = 0; i < howMany; i++) {
            let asteroid = new Asteroid({
                size: 80,
                position: {
                    x: randomNumBetweenExcluding(0, this.state.screen.width, rocket.position.x-60, rocket.position.x+60),
                    y: randomNumBetweenExcluding(0, this.state.screen.height, rocket.position.y-60, rocket.position.y+60)
                },
                create: this.createObject.bind(this),
                addScore: this.addScore.bind(this)
            });
            this.createObject(asteroid, 'asteroids');
        }
    }

    update() {

        if(this.state.inGame || this.state.gameOver) {
            const context = this.state.context;
            const keys = this.state.keys;
            const rocket = this.rocket[0];

            context.save();
            context.scale(this.state.screen.ratio, this.state.screen.ratio);

            // Motion trail
            context.fillStyle = '#000';
            context.globalAlpha = 0.4;
            context.fillRect(0, 0, this.state.screen.width, this.state.screen.height);
            context.globalAlpha = 1;

            // Next set of asteroids
            if(!this.asteroids.length){
                let count = this.state.asteroidCount + 1;
                this.setState({ asteroidCount: count });
                this.generateAsteroids(count)
            }

            // Check for colisions
            this.checkCollisionsWith(this.bullets, this.asteroids);
            this.checkCollisionsWith(this.rocket, this.asteroids);

            // // Remove or render
            this.updateObjects(this.particles, 'particles')
            this.updateObjects(this.asteroids, 'asteroids')
            this.updateObjects(this.bullets, 'bullets')
            this.updateObjects(this.rocket, 'rocket')

            context.restore();
        }


        // Next frame
        requestAnimationFrame(() => {this.update()});
    }

    createObject(item, group){
        this[group].push(item);
    }

    checkCollisionsWith(items1, items2) {
        var a = items1.length - 1;
        var b;
        for(a; a > -1; --a){
            b = items2.length - 1;
            for(b; b > -1; --b){
                var item1 = items1[a];
                var item2 = items2[b];
                if(this.checkCollision(item1, item2)){
                    item1.destroy();
                    item2.destroy();
                }
            }
        }
    }

    checkCollision(obj1, obj2){
        var vx = obj1.position.x - obj2.position.x;
        var vy = obj1.position.y - obj2.position.y;
        var length = Math.sqrt(vx * vx + vy * vy);
        if(length < obj1.radius + obj2.radius){
            return true;
        }
        return false;
    }


    updateObjects(items, group){
        let index = 0;
        for (let item of items) {
            if (item.delete) {
                this[group].splice(index, 1);
            }else{
                items[index].render(this.state);
            }
            index++;
        }
    }


    changeColor() {
        console.log('changing color');
        if(rocket_color[this.state.rocket_color + 1]) {
            this.setState({rocket_color: this.state.rocket_color + 1})
        } else {
            this.setState({rocket_color: 1})
        }

    }

    renderControls() {
        if(this.state.inGame || this.state.gameOver)
        return (
            <div>
                <span className="score current-score" >Score: {this.state.currentScore}</span>
                <span className="score top-score" >Top Score: {this.state.topScore}</span>
                <span className="controls" >
                  Use [A][S][W][D] or [←][↑][↓][→] to MOVE<br/>
                  Use [SPACE] to SHOOT
                </span>
            </div>
        )
    }


    render() {

        let startgame;

        if(!this.state.inGame && !this.state.gameOver){
            startgame = (
                <div className='start'>
                    <h1><FontAwesome name='rocket' spin/> BE THE ROCKET <FontAwesome name='rocket' spin/></h1>
                    <img onClick={() => this.changeColor()} src={'img/' + rocket_color[this.state.rocket_color]}/>
                    <p><FontAwesome name='arrow-up'/></p>
                    <p>Click Me!</p>
                    <button
                        onClick={ this.startGame.bind(this) }>
                        start
                    </button>
                </div>
            )
        }

        if(!this.state.inGame && this.state.gameOver){
            startgame = (
                <div className='start'>
                    <h1>GAME OVER</h1>
                    <img onClick={() => this.changeColor()} src={'img/' + rocket_color[this.state.rocket_color]}/>
                    <p>Click Me!</p>

                    <FacebookShareButton
                        url={'https://ggomaeng.github.io/be-the-rocket/'}
                        title={'비더로켓 - BE THE ROCKET'}
                        description={'내 점수는 ' + this.state.currentScore + ' 인데 깰수있겠어?'}
                    >
                        <button>
                            Share <FontAwesome name='facebook' color='blue'/>
                        </button>
                    </FacebookShareButton>
                    <br/>
                    <button
                        onClick={ this.startGame.bind(this) }>
                        Try Again <FontAwesome name="refresh"/>
                    </button>
                </div>
            )
        }


        return (
            <div>
                {startgame}
                {this.renderControls()}
                <canvas ref='canvas'
                        width={this.state.screen.width * this.state.screen.ratio}
                        height={this.state.screen.height * this.state.screen.ratio}
                />
            </div>
        );
    }
}
