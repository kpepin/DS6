window.addEventListener("load", function(e){
    images = document.querySelectorAll("img")
    images.forEach(function(image){
        image.src = "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg"
    })
})

console.log("Welcome to content.js")