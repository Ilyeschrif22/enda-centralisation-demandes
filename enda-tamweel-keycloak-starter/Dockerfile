FROM quay.io/keycloak/keycloak:24.0.3

COPY themes/login-theme /opt/keycloak/themes/login-theme
COPY data /opt/keycloak/data

RUN /opt/keycloak/bin/kc.sh build

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--http-port=8180"]
