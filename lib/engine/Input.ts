/**
 * Input manager for keyboard, mouse, and touch controls
 */
export interface InputState {
  keys: Set<string>;
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    buttons: Set<number>;
  };
  touch: {
    active: boolean;
    touches: Array<{ id: number; x: number; y: number }>;
  };
}

export class Input {
  private state: InputState;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.state = {
      keys: new Set(),
      mouse: {
        x: 0,
        y: 0,
        deltaX: 0,
        deltaY: 0,
        buttons: new Set(),
      },
      touch: {
        active: false,
        touches: [],
      },
    };
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Mouse
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);

    // Touch
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
      this.canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
      this.canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    }

    // Prevent context menu on canvas
    this.canvas?.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.state.keys.add(e.key.toLowerCase());
    this.state.keys.add(e.code.toLowerCase());
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.state.keys.delete(e.key.toLowerCase());
    this.state.keys.delete(e.code.toLowerCase());
  };

  private onMouseMove = (e: MouseEvent): void => {
    this.state.mouse.deltaX = e.movementX;
    this.state.mouse.deltaY = e.movementY;
    this.state.mouse.x = e.clientX;
    this.state.mouse.y = e.clientY;
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.state.mouse.buttons.add(e.button);
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.state.mouse.buttons.delete(e.button);
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    this.state.touch.active = true;
    this.updateTouches(e.touches);
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    this.updateTouches(e.touches);
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.updateTouches(e.touches);
    if (e.touches.length === 0) {
      this.state.touch.active = false;
    }
  };

  private updateTouches(touches: TouchList): void {
    this.state.touch.touches = Array.from(touches).map((t) => ({
      id: t.identifier,
      x: t.clientX,
      y: t.clientY,
    }));
  }

  isKeyPressed(key: string): boolean {
    return this.state.keys.has(key.toLowerCase());
  }

  isMouseButtonPressed(button: number): boolean {
    return this.state.mouse.buttons.has(button);
  }

  getMouseDelta(): { x: number; y: number } {
    return { x: this.state.mouse.deltaX, y: this.state.mouse.deltaY };
  }

  getTouches(): Array<{ id: number; x: number; y: number }> {
    return this.state.touch.touches;
  }

  isTouchActive(): boolean {
    return this.state.touch.active;
  }

  reset(): void {
    this.state.mouse.deltaX = 0;
    this.state.mouse.deltaY = 0;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);

    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart);
      this.canvas.removeEventListener('touchmove', this.onTouchMove);
      this.canvas.removeEventListener('touchend', this.onTouchEnd);
    }
  }
}
