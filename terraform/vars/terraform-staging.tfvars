container_port            = "80"
environment               = "staging"
log_level                 = "info"
desired_count             = 1
auto_scaling_min_capacity = 1
auto_scaling_max_capacity = 15

auth_url                  = "https://staging-api.resourcewatch.org"
geostore_api_url          = "https://staging-api.resourcewatch.org/v1"
areas_api_url             = "https://staging-api.resourcewatch.org"
s3_bucket                 = "forest-watcher-files"
s3_folder                 = "forms-staging"
s3_access_key_id          = "overridden_in_github_secrets"
s3_secret_access_key      = "overridden_in_github_secrets"

healthcheck_path = "/v3/gfw/healthcheck"
healthcheck_sns_emails = []