let currentLanguage = 'ro';  // Cambiado de 'es' a 'ro'
let recipes = [];
let translations = {};
let currentPage = 1;
const recipesPerPage = 24; // Aumentado de 12 a 24 para mostrar más recetas

// Función para obtener la lista de ingredientes
function getIngredientsList(translatedRecipe) {
    if (!translatedRecipe.ingredients) return [];
    
    // Si los ingredientes están en secciones
    if (typeof translatedRecipe.ingredients === 'object' && !Array.isArray(translatedRecipe.ingredients)) {
        return Object.values(translatedRecipe.ingredients).flat();
    }
    
    // Si es un array simple
    return translatedRecipe.ingredients;
}

function updateTexts() {
    if (!translations[currentLanguage]) return;
    
    const elements = {
        'pageTitle': translations[currentLanguage].pageTitle,
        'filterLabel': translations[currentLanguage].filterByCategory,
        'footerText': translations[currentLanguage].footerText,
        'footerTerms': translations[currentLanguage].footer.termsShort
    };

    for (const [id, text] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    // Actualizar placeholder del campo de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = translations[currentLanguage].searchPlaceholder;
    }
}

function updateCategories() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect || !translations[currentLanguage]) return;

    const uniqueCategories = [...new Set(recipes.map(recipe => recipe.category))];
    
    categorySelect.innerHTML = `
        <option value="all">${translations[currentLanguage].allCategories} 🍳</option>
        ${uniqueCategories.map(category => `
            <option value="${category}">
                ${getRecipeEmoji(category)} ${translations[currentLanguage].categories[category] || category}
            </option>
        `).join('')}
    `;
}

function getRecipeEmoji(category) {
    const emojis = {
        'Postres': '🍰',
        'Pastas': '🍝',
        'Ensaladas': '🥗',
        'Sopas': '🥣',
        'Carnes': '🥩',
        'Pescados': '🐟',
        'Bebidas': '🥤',
        'Panadería': '🥖',
        'Platos principales': '🍽️'
    };
    return emojis[category] || '🍳';
}

function renderRecipes(recipesToShow) {
    const container = document.getElementById('recipesContainer');
    if (!container) return;

    container.innerHTML = '';
    const recipesGrid = document.createElement('div');
    recipesGrid.className = 'recipes-grid';

    const recipesForCurrentPage = recipesToShow
        .slice((currentPage - 1) * recipesPerPage, currentPage * recipesPerPage)
        .filter(recipe => {
            // Verificar que la receta tenga traducciones válidas
            return recipe && recipe.translations && 
                   (recipe.translations[currentLanguage] || 
                    recipe.translations['es'] || 
                    recipe.translations['en']);
        });

    recipesForCurrentPage.forEach(recipe => {
        // Obtener la traducción con fallback
        const translatedRecipe = recipe.translations[currentLanguage] || 
                               recipe.translations['es'] || 
                               recipe.translations['en'];

        if (!translatedRecipe) return;

        const recipeElement = document.createElement('div');
        recipeElement.className = 'recipe-item';
        recipeElement.onclick = () => openRecipeModal(recipe);
        
        const recipeEmoji = getRecipeEmoji(recipe.category);
        const ingredients = getIngredientsList(translatedRecipe);
        
        recipeElement.innerHTML = `
            <h3>${recipeEmoji} ${translatedRecipe.name}</h3>
            <p>${translatedRecipe.description || ''}</p>
            <div class="recipe-preview">
                <div class="recipe-metadata-preview">
                    <span>⏱️ ${recipe.metadata.totalTime} min</span>
                    <span>👤 ${recipe.metadata.servings} ${translations[currentLanguage].servings || 'servings'}</span>
                    <span>📊 ${translations[currentLanguage].metadata?.difficulty?.[recipe.metadata.difficulty] || recipe.metadata.difficulty}</span>
                </div>
                <h4 class="ingredients-title">📝 ${translations[currentLanguage].recipeLabels?.ingredients || 'Ingredients'}</h4>
                <ul class="ingredients-preview">
                    ${ingredients.slice(0, 3).map(ing => `<li>${getIngredientEmoji(ing)}${ing}</li>`).join('')}
                    ${ingredients.length > 3 ? 
                        `<li class="more-items">+${ingredients.length - 3} ${translations[currentLanguage].moreItems || 'more items'}</li>` : ''}
                </ul>
                <button class="show-more">${translations[currentLanguage].showMore || 'Show more'}</button>
            </div>
        `;
        
        recipesGrid.appendChild(recipeElement);
    });

    container.appendChild(recipesGrid);

    // Agregar paginación si hay más de una página
    const totalPages = Math.ceil(recipesToShow.length / recipesPerPage);
    if (totalPages > 1) {
        renderPagination(totalPages, recipesToShow.length);
    }
}

function renderPagination(totalPages, totalRecipes) {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';
    
    const paginationText = translations[currentLanguage].pagination || {};
    
    let paginationHTML = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <span class="arrow">←</span> ${paginationText.previous}
        </button>
        <div class="page-info">
            <span>${paginationText.page} ${currentPage} ${paginationText.of} ${totalPages}</span>
            <span class="total-recipes">(${totalRecipes} ${paginationText.recipes})</span>
        </div>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            ${paginationText.next} <span class="arrow">→</span>
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
    document.getElementById('recipesContainer').appendChild(paginationContainer);
}

function changePage(newPage) {
    if (newPage < 1) return;
    const totalPages = Math.ceil(recipes.length / recipesPerPage);
    if (newPage > totalPages) return;
    
    currentPage = newPage;
    filterRecipes();
    window.scrollTo(0, 0); // Volver al inicio de la página
}

function openRecipeModal(recipe) {
    try {
        if (!recipe || !recipe.translations) {
            console.error('Receta inválida:', recipe);
            return;
        }

        // Intentar obtener la traducción en el siguiente orden: idioma actual -> español -> inglés
        const translatedRecipe = recipe.translations[currentLanguage] || 
                               recipe.translations['es'] || 
                               recipe.translations['en'];

        if (!translatedRecipe) {
            console.error('No se encontró traducción para la receta:', recipe);
            return;
        }

        const modal = document.getElementById('recipeModal');
        const modalContent = modal.querySelector('.modal-content');
        
        if (!modalContent) {
            console.error('No se encontró el contenedor del modal');
            return;
        }

        // Validar que existan todos los campos necesarios
        const recipeTitle = translatedRecipe.name || 'Receta sin nombre';
        const recipeDescription = translatedRecipe.description || '';
        const ingredients = translatedRecipe.ingredients || [];
        const instructions = translatedRecipe.instructions || [];
        const tips = translatedRecipe.tips || [];

        modalContent.innerHTML = `
            <span class="close-button" onclick="closeModal()">&times;</span>
            <h2>${recipeTitle}</h2>
            ${recipeDescription ? `<p class="recipe-description">${recipeDescription}</p>` : ''}
            <div class="modal-sections">
                ${renderMetadata(recipe)}
                ${renderNutrition(recipe)}
                ${renderIngredients({ ...translatedRecipe, ingredients })}
            </div>
            ${renderInstructions({ ...translatedRecipe, instructions })}
            ${renderTips({ ...translatedRecipe, tips })}
        `;

        modal.style.display = 'flex';

    } catch (error) {
        console.error('Error al abrir el modal:', error);
    }
}

// Mejorar la función closeModal para mayor robustez
function closeModal() {
    try {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al cerrar el modal:', error);
    }
}

function renderMetadata(recipe) {
    if (!recipe.metadata) return '';
    
    const labels = translations[currentLanguage].metadata.labels;
    return `
        <div class="recipe-metadata">
            <h4>📋 ${translations[currentLanguage].recipeLabels.details}</h4>
            <ul style="list-style-type: none; padding-left: 0;"> <!-- Quitamos los puntos -->
                <li>⏱️ ${labels.prepTime}: ${recipe.metadata.prepTime} ${labels.minutes}</li>
                <li>👥 ${labels.servings}: ${recipe.metadata.servings}</li>
                <li>📊 ${labels.difficulty}: ${translations[currentLanguage].metadata.difficulty[recipe.metadata.difficulty]}</li>
                ${recipe.metadata.author ? `<li>👨‍🍳 ${labels.author}: ${recipe.metadata.author}</li>` : ''}
            </ul>
        </div>
    `;
}

function renderNutrition(recipe) {
    if (!recipe.metadata?.nutrition) return '';
    
    const nutrition = recipe.metadata.nutrition;
    const nutritionLabels = translations[currentLanguage].nutrition;
    
    return `
        <div class="nutrition-info">
            <h4>🥗 ${translations[currentLanguage].recipeLabels.nutritionalInfo}</h4>
            <ul style="list-style-type: none; padding-left: 0;"> <!-- Quitamos los puntos -->
                <li>🔥 ${nutritionLabels.calories}: ${nutrition.calories} kcal</li>
                <li>🥩 ${nutritionLabels.protein}: ${nutrition.protein}g</li>
                <li>🍚 ${nutritionLabels.carbs}: ${nutrition.carbs}g</li>
                <li>🥑 ${nutritionLabels.fat}: ${nutrition.fat}g</li>
                <li>🌾 ${nutritionLabels.fiber}: ${nutrition.fiber}g</li>
                ${nutrition.sugar ? `<li>🍯 ${nutritionLabels.sugar}: ${nutrition.sugar}g</li>` : ''}
                ${nutrition.sodium ? `<li>🧂 ${nutritionLabels.sodium}: ${nutrition.sodium}mg</li>` : ''}
                <li>📏 ${nutritionLabels.servingSize}: ${nutrition.servingSize}</li>
            </ul>
        </div>
    `;
}

function getIngredientEmoji(ingredient) {
    const ingredientEmojis = {
        'harina': '🌾',
        'flour': '🌾',
        'Făină': '🌾',
        'azúcar': '🍯',
        'sugar': '🍯',
        'Zahăr': '🍯',
        'huevo': '🥚',
        'eggs': '🥚',
        'Ou': '🥚',
        'leche': '🥛',
        'milk': '🥛',
        'lapte': '🥛',
        'mantequilla': '🧈',
        'butter': '🧈',
        'unt': '🧈',
        'chocolate': '🍫',
        'ciocolată': '🍫',
        'chocolate negro': '🍫',
        'nueces': '🥜',
        'walnuts': '🥜',
        'nuca': '🥜',
        'vainilla': '🌸',
        'vanilla': '🌸',
        'vanilie': '🌸',
        'sal': '🧂',
        'salt': '🧂',
        'sare': '🧂',
        'aceite': '🫒',
        'oil': '🫒',
        'ulei': '🫒',
        'manzana': '🍎',
        'apple': '🍎',
        'Mere': '🍎',
        'limón ': '🍋',
        'lemon ': '🍋',
        'lămâie ': '🍋',
        'cebolla ': '🧅',
        'onion ': '🧅',
        'ceapă ': '🧅',
        'arroz ': '🍚',
        'rice ': '🍚',
        'orez ': '🍚',
        'café ': '🟤',
        'coffee ': '🟤',
        'cafea ': '🟤'
    };

    // Buscar coincidencia en el diccionario (ignorando mayúsculas/minúsculas)
    const match = Object.keys(ingredientEmojis).find(key => 
        ingredient.toLowerCase().includes(key.toLowerCase())
    );
    
    return match ? `${ingredientEmojis[match]} ` : '🔸 ';
}

function renderIngredients(translatedRecipe) {
    const ingredients = translatedRecipe.ingredients;
    
    if (!ingredients) return '';

    // Si los ingredientes están organizados en secciones
    if (typeof ingredients === 'object' && !Array.isArray(ingredients)) {
        return `
            <div class="recipe-ingredients">
                <h4>🧂 ${translations[currentLanguage].recipeLabels.ingredients}</h4>
                <div class="ingredients-sections-container">
                    ${Object.entries(ingredients).map(([section, items]) => `
                        <div class="ingredients-section">
                            <h5>${section.charAt(0).toUpperCase() + section.slice(1)}</h5>
                            <ul style="list-style-type: none;"> <!-- Eliminamos el punto -->
                                ${items.map(ing => `<li>${getIngredientEmoji(ing)}${ing}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Si es una lista simple de ingredientes
    return `
        <div class="recipe-ingredients">
            <h4>🧂 ${translations[currentLanguage].recipeLabels.ingredients}</h4>
            <ul style="list-style-type: none;"> <!-- Eliminamos el punto -->
                ${ingredients.map(ing => `<li>${getIngredientEmoji(ing)}${ing}</li>`).join('')}
            </ul>
        </div>
    `;
}

function renderInstructions(translatedRecipe) {
    if (!translatedRecipe.instructions) return '';
    
    let instructionsHtml = '';
    if (Array.isArray(translatedRecipe.instructions)) {
        instructionsHtml = translatedRecipe.instructions.map((step, index) => `
            <div class="instruction-step">
                <h5>${translations[currentLanguage].recipeLabels.step} ${index + 1}</h5>
                <p>${typeof step === 'object' ? step.text : step}</p>
                ${typeof step === 'object' && step.time ? 
                    `<small>⏱️ ${step.time}</small>` : ''}
            </div>
        `).join('');
    } else {
        instructionsHtml = `
            <div class="instruction-step">
                <p>${translatedRecipe.instructions}</p>
            </div>
        `;
    }

    return `
        <div class="recipe-instructions">
            <h4>👩‍🍳 ${translations[currentLanguage].recipeLabels.instructions}</h4>
            <div class="instructions-container">
                ${instructionsHtml}
            </div>
        </div>
    `;
}

function renderTips(translatedRecipe) {
    if (!translatedRecipe.tips?.length) return '';
    
    return `
        <div class="recipe-tips">
            <h4>💡 ${translations[currentLanguage].recipeLabels.tips}</h4>
            <ul>
                ${translatedRecipe.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;
}

function filterRecipes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedCategory = document.getElementById('categorySelect').value;
    
    let filteredRecipes = recipes;
    
    // Filtrar por categoría
    if (selectedCategory !== 'all') {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.category === selectedCategory);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
        filteredRecipes = filteredRecipes.filter(recipe => {
            const translatedRecipe = recipe.translations[currentLanguage];
            if (!translatedRecipe) return false;
            
            // Buscar en nombre
            if (translatedRecipe.name.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Buscar en descripción
            if (translatedRecipe.description && 
                translatedRecipe.description.toLowerCase().includes(searchTerm)) {
                return true;
            }
            
            // Buscar en ingredientes - corregido para manejar ingredientes en secciones
            if (translatedRecipe.ingredients) {
                if (typeof translatedRecipe.ingredients === 'object' && !Array.isArray(translatedRecipe.ingredients)) {
                    // Para ingredientes organizados en secciones
                    const allIngredients = Object.values(translatedRecipe.ingredients)
                        .flat()
                        .map(ing => ing.toLowerCase());
                    return allIngredients.some(ing => ing.includes(searchTerm));
                } else {
                    // Para ingredientes en lista simple
                    return translatedRecipe.ingredients.some(ingredient => 
                        ingredient.toLowerCase().includes(searchTerm)
                    );
                }
            }
            
            return false;
        });
    }
    
    renderRecipes(filteredRecipes);
}

function changeLanguage(lang) {
    currentLanguage = lang;
    updateTexts();
    updateCategories();
    renderRecipes(recipes);
}

async function loadTranslations() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
        updateTexts();
    } catch (error) {
        console.error('Error al cargar las traducciones:', error);
    }
}

async function loadRecipes() {
    try {
        const response = await fetch('recipes.json');
        recipes = await response.json();
        updateCategories();
        renderRecipes(recipes);
    } catch (error) {
        console.error('Error al cargar las recetas:', error);
    }
}

function showLegalTerms() {
    const modal = document.getElementById('recipeModal');
    const modalContent = modal.querySelector('.modal-content');
    
    const legalContent = `
        <span class="close-button" onclick="closeModal()">&times;</span>
        <h2>${translations[currentLanguage].footer.terms}</h2>
        <div class="legal-content">
            <h3>${translations[currentLanguage].footer.copyright}</h3>
            <p>${translations[currentLanguage].footer.fullTerms || 'Este sitio web y su contenido están protegidos por las leyes de derechos de autor. Todos los derechos están reservados.'}</p>
            <p>${translations[currentLanguage].footer.privacyPolicy || 'Nos comprometemos a proteger tu privacidad y tus datos personales.'}</p>
            <p>${translations[currentLanguage].footer.cookies || 'Este sitio utiliza cookies para mejorar tu experiencia.'}</p>
        </div>
    `;

    modalContent.innerHTML = legalContent;
    modal.style.display = 'flex';
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    await loadRecipes();

    // Event listeners
    window.onclick = (event) => {
        if (event.target === document.getElementById('recipeModal')) {
            closeModal();
        }
    };

    // Agregar el event listener para los términos legales
    const footerTerms = document.getElementById('footerTerms');
    if (footerTerms) {
        footerTerms.addEventListener('click', showLegalTerms);
    }
});

