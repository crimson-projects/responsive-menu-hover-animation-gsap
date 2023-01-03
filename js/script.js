console.clear();

let mousePos = { x: 0, y: 0 };
let mousePosCache = mousePos;
let direction = {
	x: mousePosCache.x - mousePos.x,
	y: mousePosCache.y - mousePos.y
};
let cursors = [];

class App {
	constructor() {
		preloader(".menu__item").then(() => {
			Splitting();
			const menuEl = document.querySelector(".menu");
			new LocomotiveScroll({ el: menuEl, smooth: true });
			new Menu(menuEl);
			cursors.push(
				new Cursor(document.querySelector(".cursor__small"), 0),
				new Cursor(document.querySelector(".cursor__large"), 0.4)
			);
			window.addEventListener("mousemove", (e) => {
				mousePos = getMousePos(e);
				cursors.forEach((cursor) => {
					cursor.update();
				});
			});
		});
	}
}

class Menu {
	constructor(el) {
		this.el = el;
		this.menuItems = this.el.querySelectorAll(".menu__item");

		this.animatableProperties = {
			tx: { previous: 0, current: 0, amt: 0.1 },
			ty: { previous: 0, current: 0, amt: 0.1 },
			rotation: { previous: 0, current: 0, amt: 0.08 },
			skewx: { previous: 0, current: 0, amt: 0.08 },
			brightness: { previous: 1, current: 1, amt: 0.08 },
			saturation: { previous: 0, current: 0, amt: 0.1 }
		};

		this.menuItemInstances = [];

		[...this.menuItems].forEach((item, pos) =>
			this.menuItemInstances.push(
				new MenuItem(item, pos, this.animatableProperties)
			)
		);

		gsap.to(this.el, 0.1, { opacity: 1 });

		this.showMenuItems();
	}
	showMenuItems() {
		gsap.fromTo(
			this.menuItemInstances.map((item) => item.DOM.innerText),
			{
				rotation: (i) => (i % 2 == 0 ? 15 : -15)
			},
			{
				duration: 1.2,
				ease: "Expo.easeOut",
				transformOrigin: (i) => (i % 2 == 0 ? "left bottom" : "right bottom"),
				y: 0,
				rotation: 0,
				delay: (pos) => 0.15 + pos * 0.06
			}
		);
	}
}

class MenuItem {
	constructor(el, menuItemIndex, animatableProps) {
		this.DOM = { el };
		this.DOM.innerText = this.DOM.el.querySelector(".menu__item-innertext");
		this.menuItemIndex = menuItemIndex;
		this.animatableProps = animatableProps;
		this.imageURL = this.DOM.el.getAttribute("data-img");

		this.layout();
		this.initEvents();
	}
	layout() {
		this.DOM.card = document.createElement("div");
		this.DOM.card.className = "image-card";
		this.DOM.cardInner = document.createElement("div");
		this.DOM.cardInner.className = "image-card__inner";
		this.DOM.cardImage = document.createElement("div");
		this.DOM.cardImage.className = "image-card__img";
		this.DOM.cardImage.style.backgroundImage = `url(${this.imageURL})`;

		this.DOM.cardInner.appendChild(this.DOM.cardImage);
		this.DOM.card.appendChild(this.DOM.cardInner);
		this.DOM.el.appendChild(this.DOM.card);
	}
	initEvents() {
		const onMouseEnter = () => {
			this.showImage();
			this.firstRAFCycle = true;
			this.renderLoop();
		};
		const onMouseLeave = () => {
			this.stopRender();
			this.hideImage();
		};
		this.DOM.el.addEventListener("mouseenter", onMouseEnter);
		this.DOM.el.addEventListener("mouseleave", onMouseLeave);
	}
	calcBounds() {
		this.bounds = {
			el: this.DOM.el.getBoundingClientRect(),
			card: this.DOM.card.getBoundingClientRect(),
			cardImage: this.DOM.cardImage.getBoundingClientRect()
		};
	}
	showImage() {
		gsap.killTweensOf(this.DOM.cardInner);
		gsap.killTweensOf(this.DOM.cardImage);
		gsap
			.timeline({
				onStart: () => {
					this.DOM.el.style.zIndex = this.DOM.el.children.length;
				}
			})
			.to(this.DOM.cardInner, {
				duration: 0.8,
				ease: "elastic.out(1, 0.75)",
				transformOrigin: `50% ${direction.y < 0 ? "-20%" : "120%"}`,
				startAt: { rotation: `${direction.x < 0 ? "+" : "-"}25deg` },
				rotation: 0
			})
			.to(
				this.DOM.cardImage,
				{
					duration: 0.2,
					ease: "Sine.easeOut",
					startAt: { opacity: 0, scale: 0.6 },
					opacity: 1,
					scale: 1
				},
				0
			);
	}
	hideImage() {
		gsap.killTweensOf(this.DOM.cardInner);
		gsap.killTweensOf(this.DOM.cardImage);
		gsap
			.timeline({
				onStart: () => {
					this.DOM.el.style.zIndex = 1;
				}
			})
			.to(this.DOM.cardInner, {
				duration: 0.8,
				ease: "elastic.out(1, 0.75)",
				transformOrigin: `50% ${direction.y < 0 ? "-20%" : "120%"}`,
				rotation: `${direction.x < 0 ? "+" : "-"}25deg`
			})
			.to(
				this.DOM.cardImage,
				{
					duration: 0.2,
					ease: "Sine.easeOut",
					opacity: 0,
					scale: 0.6
				},
				0
			);
	}
	renderLoop() {
		if (!this.requestId) {
			this.requestId = requestAnimationFrame(() => this.render());
		}
	}
	stopRender() {
		if (this.requestId) {
			window.cancelAnimationFrame(this.requestId);
			this.requestId = undefined;
		}
	}
	render() {
		this.requestId = undefined;
		if (this.firstRAFCycle) {
			this.calcBounds();
		}

		this.updateAnimatableProps();

		direction = {
			x: mousePosCache.x - mousePos.x,
			y: mousePosCache.y - mousePos.y
		};
		mousePosCache = mousePos;

		gsap.set(this.DOM.card, {
			x: this.animatableProps.tx.previous,
			y: this.animatableProps.ty.previous,
			rotation: this.animatableProps.rotation.previous,
			skewX: this.animatableProps.skewx.previous,
			filter: `brightness(${this.animatableProps.brightness.previous}) saturate(${this.animatableProps.saturation.previous})`
		});

		this.firstRAFCycle = false;
		this.renderLoop();
	}

	updateAnimatableProps() {
		const mouseDistanceX = clamp(Math.abs(mousePosCache.x - mousePos.x), 0, 100);

		this.animatableProps.tx.current =
			Math.abs(mousePos.x - this.bounds.el.left) - this.bounds.card.width / 2;
		this.animatableProps.ty.current =
			Math.abs(mousePos.y - this.bounds.el.top) - this.bounds.card.height / 2;

		this.animatableProps.rotation.current = this.firstRAFCycle
			? 0
			: map(mouseDistanceX, 0, 100, 0, direction.x < 0 ? 30 : -30);
		this.animatableProps.skewx.current = this.firstRAFCycle
			? 0
			: map(mouseDistanceX, 0, 100, 1, direction.x < 0 ? -60 : 60);
		this.animatableProps.brightness.current = this.firstRAFCycle
			? 1
			: map(mouseDistanceX, 0, 100, 1, 10);
		this.animatableProps.saturation.current = this.firstRAFCycle
			? 1
			: map(mouseDistanceX, 0, 100, 1, 8);

		for (const key in this.animatableProps) {
			this.animatableProps[key].previous = this.firstRAFCycle
				? this.animatableProps[key].current
				: lerp(
						this.animatableProps[key].previous,
						this.animatableProps[key].current,
						this.animatableProps[key].amt
				  );
		}
	}
}
class Cursor {
	constructor(el, duration) {
		this.el = el;
		this.duration = duration;
		this.el.style.opacity = 0;
		this.bounds = this.el.getBoundingClientRect();
	}
	update() {
		gsap.to(this.el, {
			duration: this.duration,
			opacity: 1,
			x: mousePos.x - this.bounds.width / 2,
			y: mousePos.y - this.bounds.height / 2
		});
	}
}

// UTILITY FUNCTIONS

function preloader(selector) {
	return new Promise((resolve) => {
		const imgwrap = document.createElement("div");
		imgwrap.style.visibility = "hidden";
		document.body.appendChild(imgwrap);

		[...document.querySelectorAll(selector)].forEach((el) => {
			const imgEl = document.createElement("img");
			imgEl.style.width = 0;
			imgEl.src = el.dataset.img;
			imgEl.className = "preload";
			imgwrap.appendChild(imgEl);
		});

		imagesLoaded(document.querySelectorAll(".preload"), () => {
			gsap.to(".loading__wrapper", {
				duration: 0.8,
				opacity: 0,
				pointerEvents: "none",
				onComplete: () => {
					imgwrap.parentNode.removeChild(imgwrap);
					document.body.classList.remove("loading");
					resolve();
				},
			});
		});
	});
}

// Map number x from range [a, b] to [c, d]
function map(x, a, b, c, d) {
	return ((x - a) * (d - c)) / (b - a) + c;
}

// Linear interpolation
function lerp(a, b, n) {
	return (1 - n) * a + n * b;
}

function clamp(num, min, max) {
	return num <= min ? min : num >= max ? max : num;
}

// Gets the mouse position
function getMousePos(e) {
	let posx = 0;
	let posy = 0;
	if (!e) e = window.event;
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	} else if (e.clientX || e.clientY) {
		posx = e.clientX + body.scrollLeft + document.documentElement.scrollLeft;
		posy = e.clientY + body.scrollTop + document.documentElement.scrollTop;
	}

	return { x: posx, y: posy };
}

// INITIALIZE THE APP
const app = new App();
