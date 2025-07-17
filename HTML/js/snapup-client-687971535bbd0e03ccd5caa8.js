document.addEventListener("DOMContentLoaded", function () {
var toastContainer = document.querySelector("#snapup-toast-container");
if (!toastContainer) {
toastContainer = document.createElement("div");
toastContainer.id = "snapup-toast-container";
document.body.appendChild(toastContainer);
toastContainer.style.position = "fixed";
toastContainer.style.top = "20px";
toastContainer.style.right = "20px";
toastContainer.style.zIndex = "10000";
toastContainer.style.maxWidth = "400px";
toastContainer.style.pointerEvents = "none";
}
var eventSource = new EventSource("http:
eventSource.onopen = function() {
console.log("SnapUp client connected successfully");
};
eventSource.onmessage = function (event) {
try {
var data = JSON.parse(event.data);
if (data.type === 'connected' || data.type === 'heartbeat') {
return;
}
if (data.type === 'events' && data.data && Array.isArray(data.data)) {
data.data.forEach(function(eventObj, index) {
setTimeout(function() {
createEventNotification(eventObj);
}, 300 * index);
});
} else if (data.title && data.description) {
createEventNotification(data);
}
} catch (error) {
console.error("SnapUp client error parsing event:", error);
}
};
eventSource.onerror = function(error) {
console.error("SnapUp client connection error:", error);
};
function createEventNotification(eventData) {
var notification = document.createElement("div");
notification.style.cssText = [
"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
"border-radius: 16px",
"color: white",
"display: flex",
"align-items: center",
"padding: 16px 20px",
"margin-bottom: 12px",
"width: 100%",
"max-width: 380px",
"box-shadow: 0 10px 25px rgba(0,0,0,0.2)",
"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
"font-size: 14px",
"line-height: 1.4",
"backdrop-filter: blur(10px)",
"border: 1px solid rgba(255,255,255,0.1)",
"transform: translateX(100%)",
"transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
"pointer-events: auto",
"cursor: pointer",
"position: relative",
"overflow: hidden"
].join("; ");
var shimmer = document.createElement("div");
shimmer.style.cssText = [
"position: absolute",
"top: 0",
"left: -100%", 
"width: 100%",
"height: 100%",
"background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
"animation: snapup-shimmer 2s infinite"
].join("; ");
var iconContainer = document.createElement("div");
iconContainer.style.cssText = [
"width: 48px",
"height: 48px", 
"margin-right: 16px",
"border-radius: 12px",
"background: rgba(255,255,255,0.15)",
"display: flex",
"align-items: center",
"justify-content: center",
"flex-shrink: 0",
"backdrop-filter: blur(10px)"
].join("; ");
if (eventData.srcUrl || eventData.srcIcon) {
var icon = document.createElement("img");
icon.src = eventData.srcUrl || eventData.srcIcon;
icon.style.cssText = [
"width: 32px",
"height: 32px",
"border-radius: 8px", 
"object-fit: cover"
].join("; ");
icon.onerror = function() {
iconContainer.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http:
};
iconContainer.appendChild(icon);
} else {
iconContainer.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http:
}
var contentContainer = document.createElement("div");
contentContainer.style.cssText = "flex: 1; min-width: 0;";
var title = document.createElement("div");
title.textContent = eventData.title || "New Notification";
title.style.cssText = [
"font-weight: 600",
"font-size: 15px", 
"margin-bottom: 4px",
"color: white",
"text-shadow: 0 1px 2px rgba(0,0,0,0.1)"
].join("; ");
var message = document.createElement("div");
message.textContent = eventData.description || eventData.message || "";
message.style.cssText = [
"font-size: 13px",
"opacity: 0.9", 
"line-height: 1.3",
"color: rgba(255,255,255,0.95)"
].join("; ");
var closeButton = document.createElement("button");
closeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http:
closeButton.style.cssText = [
"background: none",
"border: none",
"color: rgba(255,255,255,0.7)",
"cursor: pointer",
"padding: 8px", 
"border-radius: 8px",
"transition: all 0.2s ease",
"margin-left: 12px",
"flex-shrink: 0"
].join("; ");
closeButton.onmouseover = function() {
this.style.background = "rgba(255,255,255,0.1)";
this.style.color = "white";
};
closeButton.onmouseout = function() {
this.style.background = "none";
this.style.color = "rgba(255,255,255,0.7)";
};
closeButton.onclick = function(e) {
e.stopPropagation();
removeNotification();
};
contentContainer.appendChild(title);
contentContainer.appendChild(message);
notification.appendChild(shimmer);
notification.appendChild(iconContainer);
notification.appendChild(contentContainer);
notification.appendChild(closeButton);
notification.onclick = function() {
if (eventData.srcUrl && eventData.srcUrl.indexOf('http') === 0) {
window.open(eventData.srcUrl, '_blank');
}
removeNotification();
};
notification.onmouseover = function() {
this.style.transform = "translateX(0) scale(1.02)";
this.style.boxShadow = "0 15px 35px rgba(0,0,0,0.3)";
};
notification.onmouseout = function() {
this.style.transform = "translateX(0) scale(1)";
this.style.boxShadow = "0 10px 25px rgba(0,0,0,0.2)";
};
function removeNotification() {
notification.style.transform = "translateX(100%) scale(0.8)";
notification.style.opacity = "0";
setTimeout(function() {
if (toastContainer.contains(notification)) {
toastContainer.removeChild(notification);
}
}, 400);
}
toastContainer.appendChild(notification);
setTimeout(function() {
notification.style.transform = "translateX(0)";
}, 50);
setTimeout(removeNotification, 8000);
}
if (!document.getElementById('snapup-shimmer-styles')) {
var style = document.createElement('style');
style.id = 'snapup-shimmer-styles';
style.textContent = '@keyframes snapup-shimmer { 0% { left: -100%; } 100% { left: 100%; } }';
document.head.appendChild(style);
}
});