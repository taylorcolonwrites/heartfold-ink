FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 DATA_DIR=/data
WORKDIR /app
COPY . /app
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8787
VOLUME /data
CMD ["node", "server.cjs"]
