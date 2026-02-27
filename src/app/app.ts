import { Component, signal } from '@angular/core';
import { StrategyCalculator } from './features/strategy-calculator/strategy-calculator';

@Component({
  selector: 'app-root',
  imports: [StrategyCalculator],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('RaceStrategist');
}
