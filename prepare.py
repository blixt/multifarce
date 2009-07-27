import os, os.path, shutil

YUI_COMPRESSOR = 'yuicompressor-2.4.2.jar'

SCRIPTS = [
    'app/js/libs/EventSource.js',
    'app/js/libs/Hash.js',
    'app/js/libs/JSON.js',
    'app/js/libs/ServiceClient.js',
    'app/js/libs/jquery.hash.js',
    'app/js/libs/Application.js',
    'app/js/intro.js',
    'app/js/jquery-extras.js',
    'app/js/settings.js',
    'app/js/api.js',
    'app/js/game.js',
    'app/js/user.js',
    'app/js/pages.intro.js',
    'app/js/pages.home.js',
    'app/js/pages.log-in.js',
    'app/js/pages.log-out.js',
    'app/js/pages.new-command.js',
    'app/js/pages.new-frame.js',
    'app/js/pages.not-found.js',
    'app/js/pages.register.js',
    'app/js/pages.outro.js',
    'app/js/outro.js',
    ]
SCRIPTS_OUT_DEBUG = 'app/js/multifarce.js'
SCRIPTS_OUT = 'app/js/multifarce.min.js'

STYLESHEETS = [
    'app/media/style.css',
    ]
STYLESHEETS_OUT = 'app/media/style.min.css'

def compress(in_files, out_file, in_type='js', verbose=False,
             temp_file='.temp'):
    temp = open(temp_file, 'w')
    for f in in_files:
        fh = open(f)
        data = fh.read() + '\n'
        fh.close()

        temp.write(data)

        print ' + %s' % f
    temp.close()

    options = ['-o "%s"' % out_file,
               '--type %s' % in_type]

    if verbose:
        options.append('-v')

    os.system('java -jar "%s" %s "%s"' % (YUI_COMPRESSOR,
                                          ' '.join(options),
                                          temp_file))

    org_size = os.path.getsize(temp_file)
    new_size = os.path.getsize(out_file)

    print '=> %s' % out_file
    print 'Original: %.2f kB' % (org_size / 1024.0)
    print 'Compressed: %.2f kB' % (new_size / 1024.0)
    print 'Reduction: %.1f%%' % (float(org_size - new_size) / org_size * 100)
    print ''

    #os.remove(temp_file)

def main():
    print 'Compressing JavaScript...'
    compress(SCRIPTS, SCRIPTS_OUT, 'js', False, SCRIPTS_OUT_DEBUG)

    print 'Compressing CSS...'
    compress(STYLESHEETS, STYLESHEETS_OUT, 'css')

if __name__ == '__main__':
    main()
