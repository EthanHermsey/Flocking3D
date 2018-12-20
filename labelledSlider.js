

class LabelledSlider{

	constructor(min, max, cur, step, label, tooltip){
		this.labeltxt = label;
		this.startValue = cur;
		this.lastClick = 0;
		this.slider = createSlider(min, max, cur, step);
		this.slider.input(()=>{
			this.label.elt.innerHTML = this.labeltxt + this.slider.value();
		})
		this.slider.mouseClicked(()=>{
			if (millis() - this.lastClick < 200){
				this.slider.value( this.startValue );
				this.slider._events.input();
			}
			this.lastClick = millis();
		})
		this.label = createDiv(this.labeltxt + this.slider.value());
		this.label.style('color', '#fcfcfc');
		this.label.style('font-size', '80%');

		if (tooltip) this.slider.elt.title = tooltip;
	}

	position(x,y){
		this.slider.position(x,y);
		this.label.position(x,y - 15);
	}

	changed(fnx){
		this.slider.changed(fnx);
	}

	value(){
		return this.slider.value();
	}
}