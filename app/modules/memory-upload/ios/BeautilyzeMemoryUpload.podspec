Pod::Spec.new do |s|
  s.name = 'BeautilyzeMemoryUpload'
  s.version = '1.0.0'
  s.summary = 'Local in-memory gallery upload for BeautiLyze'
  s.description = s.summary
  s.author = 'BeautiLyze project team'
  s.license = { :type => 'MIT', :file => '../../../../LICENSE' }
  s.source = { :path => '.' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
