import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrategyCalculator } from './strategy-calculator';

describe('StrategyCalculator', () => {
  let component: StrategyCalculator;
  let fixture: ComponentFixture<StrategyCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrategyCalculator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StrategyCalculator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
