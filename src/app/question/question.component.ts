import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Observable,
  combineLatest,
  debounceTime,
  fromEvent,
  interval,
  take,
} from 'rxjs';
import { QuestionService } from './../service/question.service';
const DEADLINE_COUNT = 30;

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit, OnDestroy {
  public name = localStorage.getItem('name')!;
  public questionList: any = [];
  public currentQuestion: number = 0;
  public points: number = 0;
  counter = DEADLINE_COUNT;
  correctAnswer: number = 0;
  incorrectAnswer: number = 0;
  interval$: any;
  progress: string = '0';
  isQuizCompleted: boolean = false;
  isTimerPaused: boolean = false;

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.getAllQuestions();
    this.startCounter();
    this.userInactiveSince(1).subscribe(() => console.log('logout'));
  }

  getAllQuestions() {
    this.questionService
      .getQuestionJson()
      .pipe(take(1))
      .subscribe((res) => (this.questionList = res.questions));
  }

  nextQuestion() {
    this.currentQuestion++;
    this.getProgressPercent();
  }

  prevQuestion() {
    this.currentQuestion--;
    this.getProgressPercent();
  }

  answer(currentQno: number, option: any) {
    if (currentQno === this.questionList.length) {
      this.isQuizCompleted = true;
      this.stopCounter();
    }
    if (option.correct) {
      this.points += 10;
      this.correctAnswer++;
      setTimeout(() => {
        this.currentQuestion++;
        this.resetCounter();
        this.getProgressPercent();
      }, 1000);
    } else {
      setTimeout(() => {
        this.currentQuestion++;
        this.resetCounter();
        this.incorrectAnswer++;
        this.getProgressPercent();
      }, 1000);
      this.points -= 10;
    }
  }

  startCounter() {
    this.interval$ = interval(1000).subscribe(() => {
      if (!this.isTimerPaused) {
        this.counter--;
        if (this.counter === 0) {
          this.currentQuestion++;
          this.counter = DEADLINE_COUNT;
          this.points -= 10;
          this.getProgressPercent();
        }
      }
    });
    setTimeout(() => {
      this.interval$.unsubscribe();
    }, 600_000);
  }

  stopCounter() {
    this.interval$.unsubscribe();
    this.counter = 0;
  }

  resetCounter() {
    this.stopCounter();
    this.counter = DEADLINE_COUNT;
    this.startCounter();
  }

  resetQuiz() {
    this.resetCounter();
    this.getAllQuestions();
    this.points = 0;
    this.counter = DEADLINE_COUNT;
    this.currentQuestion = 0;
    this.progress = '0';
  }

  pauseOrResumeQuiz() {
    if (this.isTimerPaused) {
      this.isTimerPaused = false;
    } else {
      this.isTimerPaused = true;
    }
  }

  getProgressPercent() {
    this.progress = ((this.currentQuestion / this.questionList.length) * 100)
      .toFixed(0)
      .toString();

    return this.progress;
  }

  trackByOption(index: number, option: any): string {
    return option.text;
  }

  userInactiveSince(durationInMinutes: number): Observable<Event[]> {
    const eventTypes = [
      'click',
      'mousemove',
      'mouseover',
      'scroll',
      'touchstart',
      'touchmove',
      'touchend',
      'touchcancel',
      'keydown',
      'keyup',
      'keypress',
    ];

    const allEvents$ = eventTypes.map((type) => fromEvent(document, type));

    return combineLatest(allEvents$).pipe(
      debounceTime(durationInMinutes * 60_000)
    );
  }

  ngOnDestroy() {
    if (this.interval$) {
      this.interval$.unsubscribe();
    }
  }
}
