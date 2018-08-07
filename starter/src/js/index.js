// Global app controller

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/list';
import Likes from './models/Likes';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
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
};

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
			state.recipe.parseIngredients();

			// Calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// Render recipe
			clearLoader();
			recipeView.renderRecipe(
				state.recipe,
				state.likes.isLiked(id)

			);

		} catch(e) {
			// console.log(e);
			alert('Error processing recipe!');
		}
	}
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));


// LIST CONTROLLER
	
const controlList = () => {
	// Create new List IF there is none yet
	if(!state.list) state.list = new List();

	// Add each ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});

};

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	// Handle delete button
	if(e.target.matches('.shopping__delete, .shopping__delete *')) {
		// Delete from state
		state.list.deleteItem(id);

		// Delete from UI
		listView.deleteItem(id);

		// Handle count update
	} else if(e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value);
		state.list.updateCount(id, val);
	}

});


// LIKE CONTROLLER

const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	// user has NOT yet liked current recipe
	if(!state.likes.isLiked(currentID)){
		// Add like to state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
			);
		// Toggle the like button
		likesView.toggleLikeBtn(true);

		// Add like to UI list
		likesView.renderLike(newLike);

	// user has liked current recipe
	} else {
		// Remove like from the to state
		state.likes.deleteLike(currentID);
		// Toggle the like button
		likesView.toggleLikeBtn(false);

		// Remove like from UI list
		likesView.deleteLike(currentID);

	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

// Restore liked recipes on page load
window.addEventListener('load', () => {
	state.likes = new Likes();

	// Restore Likes 
	state.likes.readStorage();

	// Toggle like menu button 
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// Render the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

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
	} else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
		// Add ingredients to shopping list
		controlList();

	} else if(e.target.matches('.recipe__love, .recipe__love *')) {
		// Like controller
		controlLike();
	}
});

