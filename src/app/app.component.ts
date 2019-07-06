import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';

const ZOOM_DEFAULT = 40;
const ZOOM_MIN = 10;
const ZOOM_MAX = 150;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'green-hell-map';
  currentZoom = ZOOM_DEFAULT;
  layers = [];
  offset = {
    x: 0,
    y: 0
  };

  @ViewChild('map', {static: true})
  map: ElementRef<SVGElement>;

  @ViewChild('zoom', {static: true})
  zoom: ElementRef<SVGGElement>;
  @ViewChild('target', {static: true})
  target: ElementRef<SVGGElement>;

  private drag = false;

  ngAfterViewInit(): void {
    const mapNativeElement = this.map.nativeElement;
    mapNativeElement.querySelectorAll('g[data-label]').forEach((itemRef) => {
      this.layers.push({
        elementRef: itemRef,
        label: itemRef.getAttribute('data-label')
      });
    });

    mapNativeElement.addEventListener('mousedown', evt => {
      this.drag = true; // i + 1 because 0 is false. I need it to be true

      const realX = Math.round(evt.layerX / (this.currentZoom / 100) - this.offset.x);
      const realY = Math.round(evt.layerY / (this.currentZoom / 100) - this.offset.y);

      if (evt.ctrlKey) {
        console.log(evt)
        this.setTargetMarkAt(realX, realY);

        const baseUrl = window.location.origin + window.location.pathname;

        window.history.pushState('page2', 'Title', baseUrl + `?target=xyz_${realX}_${realY}_${this.currentZoom}`);
      }
      console.log(`${realX},${realY}`);
    });

    mapNativeElement.addEventListener('mousemove', evt => {
      if (this.drag) {
        this.offset.x += evt.movementX;
        this.offset.y += evt.movementY;
        this.updateViewAndZoom();
      }
    });

    mapNativeElement.addEventListener('mouseup', evt => {
      this.drag = false;
    });
    mapNativeElement.addEventListener('mouseoutside', evt => {
      this.drag = false;
    });

    const params = new URLSearchParams(window.location.search);
    if (params.has('target')) {
      const targetXY = params.get('target');
      const items = targetXY.match(/^xyz_([\d]+)_([\d]+)_([\d]+)$/);

      if (!Array.isArray(items) || items.length !== 4) {
        return;
      }

      const coordX = parseInt(items[1], 10);
      const coordY = parseInt(items[2], 10);
      if (!this.validateX(coordX) || !this.validateY(coordY)) {
        return;
      }

      this.setTargetMarkAt(coordX, coordY);
      //
      // const zoom = parseInt(items[3], 10);
      // if (this.validateZoom(zoom)) {
      //   this.currentZoom = zoom;
      // }
      //
      // this.centerViewAt(coordX, coordY);
      // this.updateViewAndZoom();
    }
  }

  private setTargetMarkAt(realX, realY) {
    this.target.nativeElement.setAttribute('transform', `translate(${realX-40},${realY-12})`);
  }

  zoomIn() {
    if (this.currentZoom < ZOOM_MAX) {
      this.currentZoom += 10;
      this.updateViewAndZoom();
    }
  }

  zoomOut() {
    if (this.currentZoom > ZOOM_MIN) {
      this.currentZoom -= 10;
      this.updateViewAndZoom();
    }
  }

  private updateViewAndZoom() {
    if (this.offset.x > 0) {
      this.offset.x = 0;
    }
    if (this.offset.y > 0) {
      this.offset.y = 0;
    }
    if (this.offset.x < -3600 * (this.currentZoom / 100)) {
      this.offset.x = -3600 * (this.currentZoom / 100);
    }
    // offset Object { x: -1642, y: -1028 }     60
    // offset    Object { x: -1924, y: -1209 }    70
    // offset    Object { x: -2827, y: -1951 }    150
    this.zoom.nativeElement.setAttribute('transform', `scale(${this.currentZoom / 100}) translate(${this.offset.x} ${this.offset.y})`);
    console.log('offset', this.offset, this.currentZoom)
  }

  toggleLayer(layer: any, evt: MouseEvent) {
    if (!layer.elementRef.hasAttribute('hidden')) {
      layer.elementRef.setAttribute('hidden', 'true');
      (evt.target as HTMLAnchorElement).classList.remove('active');
    } else {
      layer.elementRef.removeAttribute('hidden');
      (evt.target as HTMLAnchorElement).classList.add('active');
    }
  }

  private validateX(value: number) {
    return value >= 0 && value <= 3630;
  }

  private validateY(value: number) {
    return value >= 0 && value <= 2300;
  }

  private validateZoom(value: number) {
    return value >= ZOOM_MIN && value <= ZOOM_MAX;
  }

  private centerViewAt(coordX: number, coordY: number) {
    const zoomFactor = this.currentZoom / 100;

    this.offset.x = (-coordX - 350) / zoomFactor;
    this.offset.y = (-coordY - 250) / zoomFactor;
  }
}
