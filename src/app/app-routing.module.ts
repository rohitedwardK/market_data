import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ObjectDetectionComponent } from './object-detection/object-detection.component';
import { AiExamplesComponent } from './ai-examples/ai-examples.component';
import { MarketDataComponent } from './market-data/market-data.component';

const routes: Routes = [
  // { path: 'langTranslation', component: LanguageTranslationComponent },
  // { path: 'speechRecognition', component: SpeechRecognitionComponent },
  { path: 'marketApi', component: MarketDataComponent },
  { path: 'aiService', component: AiExamplesComponent },
  { path: 'objectDetection', component: ObjectDetectionComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
