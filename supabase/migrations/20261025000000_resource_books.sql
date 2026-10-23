-- Allow EPUB books and larger book/document uploads for class resources.
update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/epub+zip'
  ]
where id = 'course-materials';

notify pgrst, 'reload schema';
