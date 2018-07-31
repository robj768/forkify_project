// Global app controller

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/list';
import * as recipeView from './views/recipeView';
import * as SearchView from './views/SearchView';
import { elements, renderLoader, clearLoader, SearchResPages } from './views/base';

/*
Global State of the app
Search Object
Current recipe Object 
Shopping list object 
Liked recipes 
*/

const state = {};


// SEARCH CONTROLLER

const controlSearch = async () => {
	// 1. Get Query from view
	const query = SearchView.getInput();


	if(query){
		// 2.New search object & add to state
		state.search = new Search(query);

		// 3.Prepare UI for results
		SearchView.clearInput();
		SearchView.clearResults();
		renderLoader(elements.SearchResults);

		try {

			// 4.Search for recipes
			await state.search.getResults();

			// 5. Render results in the UI
			clearLoader();
			SearchView.renderResults(state.search.result);
			
		} catch(e) {
			alert('Something wrong with the search...');
			clearLoader();
		}
	}
}

elements.SearchForm.addEventListener('submit', e => {
		e.preventDefault();
		controlSearch();
});


elements.SearchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if(btn){
		const goToPage = parseInt(btn.dataset.goto, 10);
		SearchView.clearResults();
		SearchView.renderResults(state.search.result, goToPage);
	}
});

// RECIPE CONTROLLER

const controlRecipe = async () => {
	// Get ID from url
	const id = window.location.hash.replace('#', '');
	console.log(id);


	if (id){
		// Prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		// Highlight selected search item
		if(state.search) SearchView.highlightSelected(id);

		// Create new recipe object
		state.recipe = new Recipe(id);

		try {
		
			// Get recipe dataset & parse de ingredients
			await state.recipe.getRecipe();
			console.log(state.recipe.ingredients);
			state.recipe.parseIngredients();

			// Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// Render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe);

		} catch(e) {
			alert('Error processing recipe!');
		}
	}
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')) {
		// Decrease button is clicked
		if(state.recipe.servings > 1) {
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	}else if(e.target.matches('.btn-increase, .btn-increase *')){
		// Increase button is clicked
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	}
});

window.l = new List();
