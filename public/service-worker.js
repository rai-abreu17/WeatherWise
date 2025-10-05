// Service Worker para notificações push
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  console.log("Push received:", data);

  const title = data.title || "WeatherWise - Alerta Climático";
  const options = {
    body: data.body || "Você tem uma nova notificação sobre condições climáticas.",
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    tag: data.tag || "weather-alert",
    requireInteraction: false,
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Evento de instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker instalado");
  self.skipWaiting();
});

// Evento de ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker ativado");
  event.waitUntil(clients.claim());
});
