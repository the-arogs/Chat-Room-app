
const socket = io()

// socket.on('countUpdated', (count) => {
//     console.log('Count has been updated', count)
// })


// Elements
const messageForm = document.querySelector('form')
const messageinput = messageForm.querySelector('input')
const messageButton = messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemp = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate =document.querySelector('#sidebar-template').innerHTML


const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})


const autoscroll = () => {
 // New message element
 const $newMessage = $messages.lastElementChild

 // Height of the new message
 const newMessageStyles = getComputedStyle($newMessage)
 const newMessageMargin = parseInt(newMessageStyles.marginBottom)
 const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

 // Visible height
 const visibleHeight = $messages.offsetHeight

 // Height of messages container
 const containerHeight = $messages.scrollHeight

 // How far have I scrolled?
 const scrollOffset = $messages.scrollTop + visibleHeight

 if (containerHeight - newMessageHeight <= scrollOffset) {
     $messages.scrollTop = $messages.scrollHeight
 }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})



messageForm.addEventListener('submit', (e) => {
    const text = e.target.elements.message
    e.preventDefault()

    messageButton.setAttribute('disabled', 'disabled')
    

     const chat = text.value
    socket.emit('message', {chat, username, room}, (e) => {
        messageButton.removeAttribute('disabled')
        messageinput.value = ''
        messageinput.focus()
        if (e) {
            return console.log(e)
        }
        
        
    })

})


const locationButton = document.querySelector('#send-location')

locationButton.addEventListener('click', () => {
    locationButton.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert(' Not supported')
    }

    navigator.geolocation.getCurrentPosition( (position) => {
        socket.emit('sendLocation', {
            lat : position.coords.latitude,
            long: position.coords.longitude
        }, (message) => {
            locationButton.removeAttribute('disabled')
        })
    })

})

socket.on('locationMessage', (url) => {
    
    const html = Mustache.render(locationMessageTemp, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')

    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.emit('join', { username, room}, (error) => {
    if(error) {
        alert(error)
        location.href= '/'
    }
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// 

// document.querySelector('#increment').addEventListener('click', () => {
//     socket.emit('increment')
// })