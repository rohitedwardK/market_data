import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AiExamplesComponent } from './ai-examples/ai-examples.component';
import { ObjectDetectionComponent } from './object-detection/object-detection.component';
import { MarketDataComponent } from './market-data/market-data.component';
import { AiExamplesService } from './ai-examples/ai-service.service';
import { RemoveNsPipe } from './stock_symbol.pipe';

@NgModule({
  declarations: [
    AppComponent,
    AiExamplesComponent,
    ObjectDetectionComponent,
    MarketDataComponent,
    RemoveNsPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [AiExamplesService],
  bootstrap: [AppComponent]
})
export class AppModule { }
