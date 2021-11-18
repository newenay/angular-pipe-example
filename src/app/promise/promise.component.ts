import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http"; // <-- Be sure to add to app-module @Imports
/* https://dev.to/techiediaries/angular-10-promise-by-example-bne */

@Component({
  selector: 'app-promise',
  templateUrl: './promise.component.html',
  styleUrls: ['./promise.component.css']
})
export class PromiseComponent implements OnInit {
  
  API_KEY = "e40d07f00b094602953cc3bf8537477e";

  constructor(private httpClient: HttpClient) { }

  ngOnInit(): void {
    console.log("Angular 10 Promises");
    this.fetchDataAsPromise()
      .then((data) => {
        console.log(JSON.stringify(data));
      })
      .catch((error) => {
        console.log("Promise rejected with " + JSON.stringify(error));
      });
  }

  fetchDataAsPromise() {
    return this.httpClient
    .get(
        `https://newsapi.org/v2/top-headlines?sources=techcrunch&apiKey=${this.API_KEY}`
      )
      .toPromise();
  }
}
