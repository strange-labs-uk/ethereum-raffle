const router = {
  payloadId: (router) => router && router.payload && router.payload.id ? router.payload.id : null 
}

const module = {
  router,
}

export default module