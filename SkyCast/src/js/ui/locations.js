document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card-summary');

    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            const parentCard = e.currentTarget.closest('.location-card');
            const isExpanded = parentCard.getAttribute('data-expanded') === 'true';
            
            // Toggle state
            parentCard.setAttribute('data-expanded', !isExpanded);
            e.currentTarget.setAttribute('aria-expanded', !isExpanded);
        });
        
        // Keyboard accessibility
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
});